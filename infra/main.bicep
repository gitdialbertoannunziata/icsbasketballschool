// Infrastruttura ICS Basketball School
//   az group create -n rg-icsbasketball -l westeurope
//   az deployment group create -g rg-icsbasketball -f infra/main.bicep \
//     -p adminEmails='mario@outlook.com' azureClientId='...' azureClientSecret='...'
//     (facoltativo) googleClientId='...' googleClientSecret='...'

@description('Prefisso per i nomi delle risorse (solo minuscole e numeri)')
param prefix string = 'icsbasket'

@description('Region dello storage e dei servizi email')
param location string = resourceGroup().location

@description('Region della Static Web App (regioni supportate: westeurope, eastus2, centralus, westus2, eastasia)')
param swaLocation string = 'westeurope'

@description('Email (separate da virgola) degli account Microsoft/Google che possono accedere al pannello')
param adminEmails string

@description('Facoltativo: client ID dell\'app registration Entra (solo con auth personalizzata)')
@secure()
param azureClientId string = ''

@secure()
param azureClientSecret string = ''

@description('Facoltativo: se vuoto il login Google non viene mostrato')
@secure()
param googleClientId string = ''

@secure()
param googleClientSecret string = ''

@description('Origini autorizzate a caricare file direttamente nello storage (dominio del sito)')
param allowedOrigins array = [
  'https://www.icsbasketballschool.it'
  'https://icsbasketballschool.it'
]

var suffix = uniqueString(resourceGroup().id)
var storageName = take('${prefix}${suffix}', 24)

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    // Necessario per il container "media" con lettura pubblica (immagini e PDF del sito)
    allowBlobPublicAccess: true
    allowSharedKeyAccess: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: union(allowedOrigins, ['https://${swa.properties.defaultHostname}'])
          allowedMethods: ['GET', 'HEAD', 'PUT', 'OPTIONS']
          allowedHeaders: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 3600
        }
      ]
    }
    deleteRetentionPolicy: { enabled: true, days: 14 }
    containerDeleteRetentionPolicy: { enabled: true, days: 14 }
    isVersioningEnabled: true
  }
}

resource contentContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'content'
  properties: { publicAccess: 'None' }
}

resource mediaContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'media'
  properties: { publicAccess: 'Blob' }
}

resource registrationsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'registrations'
  properties: { publicAccess: 'None' }
}

// ---- Email (Azure Communication Services con dominio gestito da Azure) ----
resource emailService 'Microsoft.Communication/emailServices@2023-04-01' = {
  name: '${prefix}-email'
  location: 'global'
  properties: { dataLocation: 'Europe' }
}

resource emailDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = {
  parent: emailService
  name: 'AzureManagedDomain'
  location: 'global'
  properties: { domainManagement: 'AzureManaged', userEngagementTracking: 'Disabled' }
}

resource communication 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name: '${prefix}-acs-${suffix}'
  location: 'global'
  properties: {
    dataLocation: 'Europe'
    linkedDomains: [emailDomain.id]
  }
}

// ---- Static Web App (piano Standard: richiesto per l'autenticazione personalizzata) ----
resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${prefix}-web'
  location: swaLocation
  sku: { name: 'Standard', tier: 'Standard' }
  properties: {}
}

resource swaSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: swa
  name: 'appsettings'
  properties: union({
    STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    ACS_CONNECTION_STRING: communication.listKeys().primaryConnectionString
    MAIL_FROM: 'DoNotReply@${emailDomain.properties.mailFromSenderDomain}'
    ADMIN_EMAILS: adminEmails
    PUBLIC_SITE_URL: 'https://${swa.properties.defaultHostname}'
  }, empty(azureClientId) ? {} : {
    AZURE_CLIENT_ID: azureClientId
    AZURE_CLIENT_SECRET: azureClientSecret
  }, empty(googleClientId) ? {} : {
    GOOGLE_CLIENT_ID: googleClientId
    GOOGLE_CLIENT_SECRET: googleClientSecret
  })
}

output staticWebAppName string = swa.name
output staticWebAppHostname string = swa.properties.defaultHostname
output storageAccountName string = storage.name
output mediaBaseUrl string = '${storage.properties.primaryEndpoints.blob}media'
output mailFrom string = 'DoNotReply@${emailDomain.properties.mailFromSenderDomain}'

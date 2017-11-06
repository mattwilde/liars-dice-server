
## DOWNLOAD mongodb here.
https://downloads.mongodb.org/win32/mongodb-win32-x86_64-2008plus-ssl-3.4.9-signed.msi

## Use this command to connect to mongoDB instance.
```"C:\Program Files\MongoDB\Server\3.4\bin\mongo" "mongodb://clusterliarsdice-shard-00-00-8n69i.mongodb.net:27017,clusterliarsdice-shard-00-01-8n69i.mongodb.net:27017,clusterliarsdice-shard-00-02-8n69i.mongodb.net:27017/dev?replicaSet=ClusterLiarsDice-shard-0" --authenticationDatabase admin --ssl --username <USERNAME> --password <PASSWORD>```

### Other useful mongodb commands

* show dbs
* use [db] 
```eg. > use dev```

Can use these once use db command is called
* show collections

Can use these with a collection name
* db.[collection].drop()
* db.[collection].reIndex()
```Need to reIndex if we change any indexes in the schema... Not available on the free tier... Sad face...```
* db['matchmaking-queued-users'].drop()
* db['current-matches'].drop()

## powershell - Accessing env variables

* Typing in ```$env``` and pressing tab will tab through existing env variables
* Typing in ```$env:MY_NEW_VAR='hello'``` will create/update an environment variable..

## Liars Dice secret environment variables
* LIARS_DICE_DB_AUTH=<auth>
* LIARS_DICE_JWT_SECRET=<secret>
* LIARS_DICE_DB_NAME=dev
* LIARS_DICE_WEB_URL=http://localhost:3000/

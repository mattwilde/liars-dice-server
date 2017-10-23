
## DOWNLOAD mongodb here.
https://downloads.mongodb.org/win32/mongodb-win32-x86_64-2008plus-ssl-3.4.9-signed.msi

## Use this command to connect to mongoDB instance.
```"C:\Program Files\MongoDB\Server\3.4\bin\mongo" "mongodb://clusterliarsdice-shard-00-00-8n69i.mongodb.net:27017,clusterliarsdice-shard-00-01-8n69i.mongodb.net:27017,clusterliarsdice-shard-00-02-8n69i.mongodb.net:27017/test?replicaSet=ClusterLiarsDice-shard-0" --authenticationDatabase admin --ssl --username <USERNAME> --password <PASSWORD>```


## powershell - Accessing env variables

* Typing in ```$env``` and pressing tab will tab through existing env variables
* Typing in ```$env:MY_NEW_VAR='hello'``` will create/update an environment variable..

## Liars Dice secret environment variables
* LIARS_DICE_DB_AUTH
* LIARS_DICE_JWT_SECRET

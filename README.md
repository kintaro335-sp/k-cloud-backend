
# K-Cloud-Backend Rest APi for Make a NAS

## Why

I DO NOT WANT TO USE NEXT CLOUD

this is my own solution

## Setup

1. install dependencies

´´´bash
npm install
´´´

2. Setup env variables; see `.env.example`

*env variables*
* FILE_ROOT the diretory where the files will be stored

example:
```env
FILE_ROOT="/home/user/data"
```

* DATABASE_URL 
location and name of the data base start with *file:*
example:
```env
DATABASE_URL="file:///home/user/database.db"
```

* SECRET_KEY the key for JWT

it is a string and can be anything

* CORS_LIST the domain and ip directions for CORS
example:
```env
CORS_LIST="http://192.168.50.239:3000|http://localhost:3000|http://localhost"
```

* SETTINGS (optional)
path where a json file with some options to store
-Note: thw filw will be deleted in every `build` if you do not set up this variable -
example:
```env
SETTINGS="/home/user/K/settings.json"
```

* NEST_APP_CLUSTER (optional)
it just ca be 2 possible values
1 for enbale cluster
0 for disable th cluster mode

3. prisma

initialize the databse with the command

```bash
npx prisma db push
```

4. run the app
build the app
```bash
npm run build
```
once the app is built you can run it using one of teh commands
* `npm run start:prod-3072`
* `npm start`
* `npm run start:prod-2048`
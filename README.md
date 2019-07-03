# ServerSLM

Backend del sistema de recomendaciones de temas y contenidos basados en Tweets de un usuario.

## Instalación
El proyecto necesita las siguientes tecnologias instaladas para su correcto funcionamiento:

* NodeJS (Version utilizada: v8.12.0)
* MongoDB

### NodeJS

Hay diferentes alternativas para instalar NodeJS dependiendo el sistema operativo donde se quiera utilizar el sistema. Las diferentes descargas se encuentran en el siguiente enlace:

[Descargar NodeJS](https://nodejs.org/en/download/)

Ademas de los instaladores, existen otros metodos de instalación como por ejemplo el package manager del sistema operativo. Por ejemplo, en Debian/Ubuntu el metodo de instalacion es el siguiente:

```sh
# Ubuntu
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

# Debian
curl -sL https://deb.nodesource.com/setup_8.x | bash -
apt-get install -y nodejs
```

[Distribuciones binarias de NodeJS](https://github.com/nodesource/distributions/blob/master/README.md)

Al instalar NodeJS, tambien instalara NPM que se utilizara para instalar las dependencias del proyecto.

### MongoDB

Para instalar MongoDB Server, dirijase al centro de descargas:

[MongoDB Download Center](https://www.mongodb.com/download-center/community)

Debera elegir el instalador correspondiente a su sistema operativo.

Si esta utilizando Windows, puede iniciar el servidor como un servicio, llendo a la consola de servicios, buscar el servicio **"MongoDB"** y haciendo click en inicializar.

Si prefiere iniciar el servidor de manera manual, puede utilizar el siguiente comando

```sh
"C:\Program Files\MongoDB\Server\4.0\bin\mongod.exe" --dbpath="c:\data\db"
```

El parametro **"dbpath"** es donde se almacenaran la informacion de sus tablas.

Para mayor informacion en el proceso de instalacion enm diferentes SO, consulte la documentacion de MongoDB:

[Install MongoDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/)

### Modulos npm

Antes de poder ejecutar el proyecto, debe instalar las dependencias del proyecto. Para eso, ejecute el siguiente comando de NPM (Si instalo correctamente NodeJS deberia tambien tener NPM):

```
npm install
```

## Configuración inicial

En el directorio **"config"** se encuentra un archivo llamado **"default.js"** que contiene un modelo de las configuraciones que existen en el sistema. Lo primero que se debe hacer es crear un archivo en el mismo directorio con el nombre **"config.js"** usando el modelo como ejemplo. A continuacion se detallan cada uno de los valores configurables:

* **port:** Puerto de la API.
* **twitterApi:** Configuraciones de la API de Twitter
  * **consumer_key:** Clave de Twitter
  * **consumer_secret:** Clave secreta de Twitter
  * **access_token_key:** Token de acceso
  * **access_token_secret:** Token secreto
* **rosetteApi:** Configuraciones de la API de Rosette
  * **key:** Clave de Rosette
* **mongo:** Configuraciones de MongoDB
  * **url:** URL de la DB de Mongo
* **values:** Configuraciones del sistema
  * **scoreKeywords:** Valores asignados al puntuar un reporte
  * **minScoreTaxonomy:** Valor minimo de Taxonomia requerido
  * **minScoreKeywords:** Valor minimo de las palabras claves requerido
  * **maxDaysCached:** Cantidad de dias de cache de los resultados
* **watson:** Configuraciones de Watson
  * **version:** Version de la API de Watson
  * **iam_apikey:** Clave IAM
  * **url:** URL de la API de Watson
* **meaningcloud:** Configuraciones de MeaningCloud
  * **key:** Clave de acceso

## Funcionamiento del sistema

Para poder iniciar el sistema, ejecute el siguiente comando:

```
node bin/www.js
```

Si todo fue configurado correctamente, la API deberia estar corriendo en el puerto que previamente se configuro.

El proyecto esta dividido en los siguientes directorios:

* **bin:** Contiene las instrucciones para iniciar el servidor
* **common:** Archivos con valores contantes que se reutilizan en el sistema
* **config:** Configuraciones del servidor
* **global:** Inicializa variables globales
* **helpers:** Funciones utilizadas a lo largo del sistema
* **middleware:** Middlewares de la API
* **modules:** Modulos que contienen la logica de los diferentes endpoints de la API
* **routes:** Configuraciones de los endpoints
* **scripts:** Scripts utilizados en el desarrollo del sistema
/* archivo principal de nuestra app */

//dependencias
const http = require('http');
const url = require('url');

//crear el servidor
const servidor = http.createServer((req, res) => {
  // obtener la url desde el request
  const urlParseada = url.parse(req.url, true);
  console.log('urlParseada ', urlParseada);
  //obtenemos la ruta
  const ruta = urlParseada.pathname;
  console.log('ruta ', ruta);
  //remover slashes
  const rutaLimpia = ruta.replace(/^\/+|\/+$/g, '');
  console.log('rutaLimpia ', rutaLimpia);
  // Obtener el metodo http
  const metodo = req.method.toLowerCase();
  console.log('metodo ', metodo);
  //enviamos la respuesta
  switch (rutaLimpia) {
    case 'hola':
      res.end('ruta hola');
      break;
    default:
      res.end('otra ruta');
  }
});

//el servidor debe mantener el proceso y escuchar peticiones http
servidor.listen(3000, () => {
  console.log('El servidor está escuchando en el puerto 3000');
});

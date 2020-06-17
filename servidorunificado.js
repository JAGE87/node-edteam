const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const _data = require('./lib/data');
const _identificador = require('./lib/identificador');

const enrutador = {
  ejemplos: (data, callback) => {
    callback(200, JSON.stringify({ mensaje: 'esto es un ejemplo' }));
  },
  noEncontrado: (data, callback) => {
    callback(404, JSON.stringify({ mensaje: 'recurso no encontrado' }));
  },
  cotizaciones: (data, callback) => {
    let usuarioId;
    switch (data.metodo) {
      case 'post':
        const identificador = _identificador;
        _data.crear(
          { directorio: data.ruta, archivo: identificador, data: data.payload },
          error => {
            if (error) {
              callback(500, JSON.stringify({ error }));
            } else {
              callback(201, data.payload);
            }
          }
        );
        break;
      case 'get':
        if (data.params && data.params.id) {
          usuarioId = data.params.id;
        } else {
          _data.listar({ directorio: data.ruta }, (error, cotizaciones) => {
            if (error) {
              callback(500, JSON.stringify({ error }));
            } else if (cotizaciones) {
              callback(200, JSON.stringify(cotizaciones));
            } else {
              callback(
                500,
                JSON.stringify({ error: 'Hubo un error al leer las cotizaciones' })
              );
            }
          });
          break;
        }
        _data.obtenerUno(
          { directorio: data.ruta, archivo: usuarioId },
          (error, usuario) => {
            if (error) {
              callback(500, JSON.stringify({ error }));
            } else if (usuario) {
              callback(200, usuario);
            } else {
              callback(
                500,
                JSON.stringify({ error: 'Hubo un error al leer el usuario' })
              );
            }
          }
        );
        break;
      case 'put':
        if (data.params && data.params.id) {
          usuarioId = data.params.id;
        } else {
          callback(404, JSON.stringify({ mensaje: 'recurso no encontrado' }));
          break;
        }
        _data.obtenerUno(
          { directorio: data.ruta, archivo: usuarioId },
          (error, usuario) => {
            if (error) {
              callback(500, JSON.stringify({ error }));
            } else if (usuario) {
              _data.eliminarUno(
                { directorio: data.ruta, archivo: usuarioId },
                error => {
                  if (error) return callback(500, JSON.stringify({ error }));
                  _data.crear(
                    {
                      directorio: data.ruta,
                      archivo: usuarioId,
                      data: data.payload
                    },
                    error => {
                      if (error) {
                        callback(500, JSON.stringify({ error }));
                      } else {
                        callback(200, data.payload);
                      }
                    }
                  );
                }
              );
            } else {
              callback(
                500,
                JSON.stringify({ error: 'Hubo un error al leer el usuario' })
              );
            }
          }
        );
        break;
      case 'delete':
        if (data.params && data.params.id) {
          usuarioId = data.params.id;
        } else {
          callback(404, JSON.stringify({ mensaje: 'recurso no encontrado' }));
          break;
        }
        _data.obtenerUno(
          { directorio: data.ruta, archivo: usuarioId },
          (error, usuario) => {
            if (error) {
              callback(404, JSON.stringify({ error }));
            } else if (usuario) {
              _data.eliminarUno(
                { directorio: data.ruta, archivo: usuarioId },
                error => {
                  if (error) return callback(500, JSON.stringify({ error }));
                  callback(
                    200,
                    JSON.stringify({
                      mensaje: 'usuario eliminado satisfactoriamente'
                    })
                  );
                }
              );
            } else {
              callback(
                500,
                JSON.stringify({ error: 'Hubo un error al leer el usuario' })
              );
            }
          }
        );
        break;

      default:
        callback(404, {
          mensaje: `no puedes usar ${data.metodo} en ${data.ruta}`
        });
        break;
    }
  }
};

const servidorUnificado = (req, res) => {
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
  // Obtenemos los queries de url
  const query = urlParseada.query;
  console.log('query', JSON.stringify(query));
  //Obtenemos los headers
  const headers = req.headers;
  console.log('headers', headers);
  // Obtenemos un payload, si hay
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  let extraer_id = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();
    console.log('buffer = ', buffer);

    const data = {
      ruta: rutaLimpia,
      query,
      metodo,
      headers,
      payload: buffer,
      params: null
    };

    //enviamos la respuesta
    const rutaIdentificador = rutaLimpia.split('/');
    const [rutaRecurso, id] = rutaIdentificador;
    let handler;
    if (rutaLimpia && enrutador[rutaLimpia]) {
      handler = enrutador[rutaLimpia];
    } else if (
      rutaIdentificador.length > 0 &&
      rutaRecurso &&
      enrutador[rutaRecurso] &&
      id
    ) {
      data.ruta = rutaRecurso;
      data.params = { id };
      handler = enrutador[rutaRecurso];
    } else {
      handler = enrutador.noEncontrado;
    }

    handler(data, (statusCode = 200, respuesta) => {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(respuesta);
    });
  });
};

module.exports = servidorUnificado;

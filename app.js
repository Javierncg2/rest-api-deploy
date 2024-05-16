/* CREAR REST API
- Arquitectura de software.
- Contruir APIs
- Escabilidad, simplicidad, portabilidad, visibilidad, fiabilidad, facil de modificar
*/

//===========================================================
/* Inicializa el proyecto 
- npm init -y
- npm install express -E 
- node --watch */

//======================================
// SE INICIALIZA EL PROGRAMA
//======================================
//Se inicializa el sistema EXPRESS
const express = require("express"); //Se importa el frameworks
const app = express(); //Se plantea app
app.use(express.json()); //Analiza (parsea) las solicitudes

//Se abre un puerto
const PORT = process.env.PORT ?? 1234; //SE ABRE PUERTO
app.disable("x-powered-by"); //Desabilitar el header X-powered-by

//Se importa info que se necesitará
const movies = require("./movies.json");
const crypto = require("node:crypto"); //Crea id random

//SE OBTIENE CORS
/*CORS es un protocolo que define cómo las solicitudes 
  HTTP realizadas desde un origen diferente (diferente 
  dominio, protocolo o puerto) pueden ser permitidas o 
  bloqueadas por el servidor. Sin una configuración adecuada, 
  los navegadores bloquean estas solicitudes por razones de seguridad*/
const cors = require("cors");

//Valida y analiza esquemas
//const z = require('zod')
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

//======================================
//SE realiza el protocolo CORS
//======================================
/*Se permite el ingreso solo de un numero determinado de sitios
- origin: origen de la solicitud (dominio desde el que se solicita)
- ACCEPTED_ORIGINS: lista con los origenes permitidos
*/
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        "http://localhost:8080",
        "http://localhost:1234",
        "https://movies.com",
        "https://midu.dev", //Se pueden agregar tantas como se quiera
      ];

      /*Se comprueba si el origen de la solicitud está en la lista de 
      orígenes aceptados. Si es así, llama al callback sin error (null) 
      y con true, permitiendo la solicitud*/
      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      /*Maneja el caso en que origin es undefined o null. Esto puede 
      ocurrir en solicitudes no procedentes de navegadores, como llamadas 
      desde herramientas de línea de comandos o servidores. Si origin es null,
      permite la solicitud*/
      if (!origin) {
        return callback(null, true);
      }

      /*Si el origen no está en la lista aceptada y no es null, deniega 
      la solicitud llamando al callback con un error. */
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

//======================================
//Se analizaran los requerimientos
//======================================

//Todos los recursos que sean MOVIES se identifican con movies
app.get("/movies", (req, res) => {
  //Se accede a los parametros de la solicitud
  const { genre } = req.query;
  //Se revisa si es que se ha proporcionado el parametro de 'genre'
  if (genre) {
    //Se filtra las peliculas
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    /*Si se proporciona un género y se encuentran películas que 
    coinciden, devuelve la lista filtrada como una respuesta JSON*/
    return res.json(filteredMovies);
  }
  //Si no se proporciona un género, devuelve todas las películas
  res.json(movies);
});

/*path-to-regexp: Se buscan peliculas por un parametro
- segmento dinamico
- Se recuperan la info del parametro*/
app.get("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);
  res.status(404).jason({ message: "Movie not found" });
});

// SE QUIERE CREAR UNA PELICULA
app.post("/movies", (req, res) => {
  //Se analiza si los datos que se quieren ingresar son validos
  const result = validateMovie(req.body);

  if (!result.success) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }

  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria

  movies.push(newMovie);
  res.status(201).json(newMovie);
});

//SE QUIERE BORRAR UNA PELICULA
app.delete("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  movies.splice(movieIndex, 1);

  return res.json({ message: "Movie deleted" });
});

//SE QUIERE ACTULIZAR UNA PELICULA (solo una parte)
app.patch("/movies/:id", (req, res) => {
  //Se analiza si los datos que se quieren ingresar son validos
  const result = validatePartialMovie(req.body);

  //Si los datos no son validos
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  //Se busca la pelicula
  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };
  movies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

//======================================
//Levantar y escuchar nuestro puerto
app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});


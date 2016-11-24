const moment = require('moment');
const Lokka = require('lokka').Lokka
const Transport = require('lokka-transport-http').Transport

const client = new Lokka({
  transport: new Transport('https://api.graph.cool/simple/v1/__PROJECT_ID__')
})

// convert to ISO 8601 format
const convertToDateTime = (time) => (
  moment(time, 'DD MMM YYYY').add(12, 'hours').format()
)

const createMovie = (movie) => (
  client.mutate(`{
    movie: createMovie(oldId: "${movie.id}", description: "${movie.description}", released: "${convertToDateTime(movie.released)}", title: "${movie.title}") {
      id
    }
  }`)
)

const createActor = (actor) => (
  client.mutate(`{
    actor: createActor(oldId: "${actor.id}", birthday: "${convertToDateTime(actor.birthday)}", gender: "male", name: "${actor.name}") {
      id
    }
  }`)
)

const createMovies = async (rawMovies) => {
  const promisedMovies = rawMovies.map((rawMovie) => {
    try {
      return createMovie(rawMovie)
    } catch (e) {
      console.log(e)
    }
  })

  const responses = await Promise.all(promisedMovies)
  return responses
}

const createActors = async (distinctActors) => {
  const promisedActors = distinctActors.map((actor) => {
    try {
      return createActor(actor)
    } catch (e) {
      console.log(e)
    }
  })

  const responses = await Promise.all(promisedActors)

  let zippedIds = responses.map((response, i) => {
    const oldId = distinctActors[i].id
    const id = response.actor.id
    return ({id, oldId})
  })

  let idMap = {}
  for(ids of zippedIds) {
    idMap[ids.oldId] = ids.id
  }
  return idMap
}

const prepareActors = (actorsByMovie) => {
  let unique = {}
  let distinctActors = []
  const flatActors = actorsByMovie.reduce((a, b) => {
    return a.concat(b)
  })

  for (actor of flatActors) {
    if (!unique[actor.id]) {
      unique[actor.id] = actor
      distinctActors.push(actor)
    }
  }

  return distinctActors
}

const connectMoviesAndActors = (idPairs) => {
  for (idPair of idPairs) {
    client.mutate(`{
      addToActorMovies(actorsActorId: "${idPair.actorId}" moviesMovieId: "${idPair.movieId}") {
        moviesMovie {
          id
        }
      }
    }`)
  }
}

const main = async () => {
  const rawMovies = require('./movies.json')
  const actorsByMovie = rawMovies.map((rawMovie) => rawMovie.actors)


  // create actors
  const actors = prepareActors(actorsByMovie)
  const idMap = await createActors(actors)
  console.log(`Created ${actors.length} actors`)


  // create movies
  const movies = await createMovies(rawMovies)
  const movieIds = movies.map((movie) => movie.movie.id)
  console.log(`Created ${movieIds.length} movies`)

  // connect movies and actors
  const idPairs = rawMovies.map((movie, i) => {
    const actorIds = movie.actors.map((actor) => idMap[actor.id])
    const movieId = movieIds[i]

    return actorIds.map((actorId) => {
      return ({actorId, movieId})
    })
  })

  const flatIdPairs = idPairs.reduce((a, b) => {
    return a.concat(b)
  })

  await connectMoviesAndActors(flatIdPairs)
  console.log(`Created ${flatIdPairs.length} edges between actors and movies`)
}

main()

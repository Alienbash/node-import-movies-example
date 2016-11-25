const _ = require('lodash');
const {Lokka} = require('lokka')
const {Transport} = require('lokka-transport-http')

// set timezone to UTC (needed for Graphcool)
process.env.TZ = 'UTC'

const client = new Lokka({
  transport: new Transport('https://api.graph.cool/simple/v1/__PROJECT_ID__')
})

// convert to ISO 8601 format
const convertToDateTimeString = (str) => new Date(Date.parse(str)).toISOString()

const createMovie = async(movie) => {
  const result = await client.mutate(`{
    movie: createMovie(
      oldId: "${movie.id}"
      description: "${movie.description}"
      released: "${convertToDateTimeString(movie.released)}"
      title: "${movie.title}"
    ) {
      id
    }
  }`)

  return result.movie.id
}

const createActor = async(actor) => {
  const result = await client.mutate(`{
    actor: createActor(
      oldId: "${actor.id}"
      birthday: "${convertToDateTimeString(actor.birthday)}"
      gender: "male"
      name: "${actor.name}"
    ) {
      id
    }
  }`)

  return result.actor.id
}

// maps from old imported id (data set) to new generated id (Graphcool)
const createMovies = async(rawMovies) => {
  const movieIds = await Promise.all(rawMovies.map(createMovie))

  return _.zipObject(rawMovies.map(movie => movie.id), movieIds)
}

const createActors = async(rawActors) => {
  const actorIds = await Promise.all(rawActors.map(createActor))

  return _.zipObject(rawActors.map(actor => actor.id), actorIds)
}

const connectMoviesAndActorsMutation = (actorId, movieId) => (
  client.mutate(`{
    addToActorMovies(actorsActorId: "${actorId}" moviesMovieId: "${movieId}") {
      # we don't need this but we need to return something
      moviesMovie {
        id
      }
    }
  }`)
)

const main = async() => {
  const rawMovies = require('../movies.json')

  const allActors = _.chain(rawMovies)
    .flatMap(rawMovie => rawMovie.actors)
    .uniqBy(actor => actor.id)
    .value()

  // create actors
  const actorIdMap = await createActors(allActors)
  console.log(`Created ${Object.keys(actorIdMap).length} actors`)

  // create movies
  const movieIdMap = await createMovies(rawMovies)
  console.log(`Created ${Object.keys(movieIdMap).length} movies`)

  // connect movies and actors
  const mutations = _.chain(rawMovies)
    .flatMap((rawMovie) => {
      const newActorIds = rawMovie.actors.map((actor) => actorIdMap[actor.id])
      const newMovieId = movieIdMap[rawMovie.id]

      return newActorIds.map((newActorId) => ({newActorId, newMovieId}))
    })
    .map(({newActorId, newMovieId}) => connectMoviesAndActorsMutation(newActorId, newMovieId))
    .value()

  await Promise.all(mutations)
  console.log(`Created ${mutations.length} edges between actors and movies`)
}

main().catch((e) => console.error(e))

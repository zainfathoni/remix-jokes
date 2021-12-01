import type { LoaderFunction } from 'remix'
import { Link, useLoaderData, useParams } from 'remix'
import type { Joke } from '@prisma/client'
import { db } from '~/utils/db.server'

type LoaderData = { joke: Joke }

export let loader: LoaderFunction = async ({ params }) => {
  let joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  })
  if (!joke) throw new Error('Joke not found')
  let data: LoaderData = { joke }
  return data
}

export default function JokeRoute() {
  let data = useLoaderData<LoaderData>()

  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{data.joke.content}</p>
      <Link to=".">{data.joke.name} Permalink</Link>
    </div>
  )
}

export function ErrorBoundary({ error }: { error: Error }) {
  let { jokeId } = useParams()
  return (
    <div className="error-boundary">{`There was an error loading the joke ${jokeId}. Error message: ${error.message}`}</div>
  )
}

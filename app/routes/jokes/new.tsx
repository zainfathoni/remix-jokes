import { ActionFunction, LoaderFunction, useTransition } from 'remix'
import { Form, redirect, useActionData, useCatch, Link } from 'remix'
import { JokeDisplay } from '~/components/joke'
import { db } from '~/utils/db.server'
import { getUserId, requireUserId } from '~/utils/session.server'

export let loader: LoaderFunction = async ({ request }) => {
  let userId = await getUserId(request)
  if (!userId) {
    throw new Response('You must be logged in to create a joke', { status: 401 })
  }
  return {}
}

function validateJokeName(name: string) {
  if (name.length < 3) {
    return 'Name must be at least 3 characters long'
  }
}

function validateJokeContent(content: string) {
  if (content.length < 10) {
    return 'Content must be at least 10 characters long'
  }
}

type ActionData = {
  formError?: string
  fieldErrors?: {
    name: string | undefined
    content: string | undefined
  }
  fields?: {
    name: string
    content: string
  }
}

export let action: ActionFunction = async ({ request }) => {
  let userId = await requireUserId(request)
  let form = await request.formData()
  let name = form.get('name')
  let content = form.get('content')
  // we do this type check to be extra sure and to make TypeScript happy
  // we'll explore validation next!
  if (typeof name !== 'string' || typeof content !== 'string') {
    return { formError: 'Form not submitted correctly.' }
  }

  let fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content),
  }
  let fields = { name, content }
  if (Object.values(fieldErrors).some(Boolean)) {
    return { fieldErrors, fields }
  }

  let joke = await db.joke.create({ data: { ...fields, jokesterId: userId } })
  return redirect(`/jokes/${joke.id}`)
}

export default function NewJokeRoute() {
  let actionData = useActionData<ActionData>()
  let transition = useTransition()

  if (transition.submission) {
    let name = transition.submission.formData.get('name')
    let content = transition.submission.formData.get('content')
    if (
      typeof name === 'string' &&
      typeof content === 'string' &&
      !validateJokeContent(content) &&
      !validateJokeName(name)
    ) {
      return <JokeDisplay joke={{ name, content }} isOwner={true} canDelete={false} />
    }
  }

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form method="post">
        <div>
          <label>
            Name:{' '}
            <input
              type="text"
              defaultValue={actionData?.fields?.name}
              name="name"
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-describedby={actionData?.fieldErrors?.name ? 'name-error' : undefined}
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{' '}
            <textarea
              defaultValue={actionData?.fields?.content}
              name="content"
              aria-invalid={Boolean(actionData?.fieldErrors?.content) || undefined}
              aria-describedby={actionData?.fieldErrors?.content ? 'content-error' : undefined}
            />
          </label>
          {actionData?.fieldErrors?.content ? (
            <p className="form-validation-error" role="alert" id="content-error">
              {actionData.fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  )
}

export function CatchBoundary() {
  let caught = useCatch()

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a joke.</p>
        <Link to="/login">Login</Link>
      </div>
    )
  }
  throw new Error(`Unhandled error: ${caught.status}`)
}

export function ErrorBoundary() {
  return <div className="error-container">Something unexpected went wrong. Sorry about that.</div>
}

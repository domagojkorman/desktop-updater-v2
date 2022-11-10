import { NextApiRequest, NextApiResponse } from 'next/types'
import fetch from 'node-fetch'

interface GithubResponse {
  name: string
}

interface Body {
  version: string
  isMandatory: boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Body>) {
  const response = await fetch('https://api.github.com/repos/toptal/desktop-app/releases/latest', {
    headers: new Headers({
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${process.env.ACCESS_KEY}`,
    }),
  })
  const githubResponse = (await response.json()) as GithubResponse

  res.status(200).json({
    version: githubResponse.name,
    isMandatory: false,
  })
}

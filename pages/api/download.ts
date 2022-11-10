import { NextApiRequest, NextApiResponse } from 'next/types'
import fetch from 'node-fetch'

export const config = {
  api: {
    responseLimit: false,
  },
}

interface Asset {
  id: string
  name: string
}

interface GithubResponse {
  name: string
  assets: Asset[]
}

type QueryType = 'linux' | 'windows' | 'macos-intel' | 'macos-arm'

interface InvalidRequest {
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NodeJS.ReadableStream | InvalidRequest>,
) {
  const type = req.query['type'] as string
  if (!type) {
    return res.status(400).json({ message: '<type> query parameter is required [macos-intel | macos-arm]' })
  }

  if (!['macos-intel', 'macos-arm'].includes(type)) {
    return res.status(400).json({ message: '<type> query parameter is required [macos-intel | macos-arm]' })
  }

  const safeType = type as QueryType

  const response = await fetch('https://api.github.com/repos/toptal/desktop-app/releases/latest', {
    headers: new Headers({
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${process.env.ACCESS_KEY}`,
    }),
  })
  const githubResponse = (await response.json()) as GithubResponse
  const asset = githubResponse.assets.find((asset) => {
    if (safeType === 'macos-arm') {
      return asset.name.includes('arm')
    } else {
      return asset.name.includes('x64')
    }
  })

  if (!asset) {
    return res.status(404).json({
      message: 'Asset not found',
    })
  }

  const assetData = await fetch(`https://api.github.com/repos/toptal/desktop-app/releases/assets/${asset.id}`, {
    headers: new Headers({
      accept: 'application/octet-stream',
      authorization: `Bearer ${process.env.ACCESS_KEY}`,
    }),
  })

  if (!assetData.body) {
    return res.status(404).json({
      message: 'DMG file not found',
    })
  }

  return res
    .status(200)
    .setHeader('content-type', 'application/octet-stream')
    .setHeader('content-disposition', `attachment; filename=${asset.name}`)
    .setHeader('content-length', assetData.headers.get('content-length') ?? 0)
    .send(assetData.body)
}

import React, { useState, useEffect } from 'react'
import Star from '../img/star'
import Fork from '../img/fork'

const repoName = 'Nafeij/kbclone'
const repo = `https://github.com/${repoName}`
const repoAPI = `https://api.github.com/repos/${repoName}`
const author = 'https://nafeij.me'

export default function Credit () {
    const [githubInfo, setGitHubInfo] = useState({
      stars: '-',
      forks: '-'
    })

    useEffect(() => {
      if (process.env.NODE_ENV !== 'production') return

      fetch(repoAPI)
        .then(async (response) => await response.json())
        .then((json) => {
          const { stargazers_count: stars, forks_count: forks } = json
          setGitHubInfo({
            stars,
            forks
          })
        })
        .catch((e) => { console.error(e) })
    }, [])

    return (
      <div className="fcredit">
        <a
          href={author}
          aria-label="Author Link"
          target="_blank"
          rel="noreferrer"
        >
          <p>Designed by Wang Jiefan.</p>
        </a>
        <a
          href={repo}
          aria-label="Repo Link"
          target="_blank"
          rel="noreferrer"
        >
          <div className="github-stats">
            <span>
              <Star />
              <span>{githubInfo.stars.toLocaleString()}</span>
            </span>
            <span>
              <Fork />
              <span>{githubInfo.forks.toLocaleString()}</span>
            </span>
          </div>
        </a>
      </div>
    )
  }
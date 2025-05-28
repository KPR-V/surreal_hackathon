"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Fuse from "fuse.js"

interface SearchOptions<T> {
  keys: (keyof T)[]
  threshold?: number
  enableFuzzySearch?: boolean
  maxResults?: number
  debounceMs?: number
}

interface SearchResult<T> {
  results: T[]
  isLoading: boolean
  searchTerm: string
}

export function useOptimizedSearch<T extends Record<string, any>>(
  data: T[],
  options: SearchOptions<T>,
): [SearchResult<T>, (term: string) => void] {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedTerm, setDebouncedTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { keys, threshold = 0.3, enableFuzzySearch = false, maxResults = 100, debounceMs = 300 } = options

  // Debounce search term
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
      setIsLoading(false)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])

  // Preprocess data for faster searching
  const preprocessedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      _searchString: keys
        .map((key) => String(item[key] || ""))
        .join(" ")
        .toLowerCase()
        .trim(),
    }))
  }, [data, keys])

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!enableFuzzySearch) return null

    return new Fuse(preprocessedData, {
      keys: keys.map((key) => String(key)),
      threshold,
      includeScore: true,
      shouldSort: true,
    })
  }, [preprocessedData, keys, threshold, enableFuzzySearch])

  // Perform search
  const results = useMemo(() => {
    if (!debouncedTerm.trim()) {
      return preprocessedData.slice(0, maxResults)
    }

    const searchTermLower = debouncedTerm.toLowerCase()

    if (enableFuzzySearch && fuse) {
      const fuseResults = fuse.search(searchTermLower)
      return fuseResults.map((result) => result.item).slice(0, maxResults)
    }

    // Fast substring search
    const filtered = preprocessedData.filter((item) => item._searchString.includes(searchTermLower))

    return filtered.slice(0, maxResults)
  }, [debouncedTerm, preprocessedData, enableFuzzySearch, fuse, maxResults])

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  return [
    {
      results: results.map(({ _searchString, ...item }) => item as unknown as T),
      isLoading,
      searchTerm,
    },
    handleSearch,
  ]
}

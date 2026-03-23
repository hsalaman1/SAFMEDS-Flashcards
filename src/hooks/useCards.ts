import { useState, useCallback } from 'react'
import type { Card } from '@/lib/types'
import { loadCards, saveCards } from '@/lib/storage'
import { generateId } from '@/lib/utils'

export function useCards() {
  const [cards, setCards] = useState<Card[]>(() => loadCards())

  const updateCards = useCallback((updated: Card[]) => {
    setCards(updated)
    saveCards(updated)
  }, [])

  const importCards = useCallback(
    (imported: Card[]) => {
      updateCards(imported)
    },
    [updateCards]
  )

  const toggleIncluded = useCallback(
    (id: string) => {
      const updated = cards.map((c) =>
        c.id === id ? { ...c, included: !c.included } : c
      )
      updateCards(updated)
    },
    [cards, updateCards]
  )

  const setAllIncluded = useCallback(
    (ids: string[], included: boolean) => {
      const idSet = new Set(ids)
      const updated = cards.map((c) =>
        idSet.has(c.id) ? { ...c, included } : c
      )
      updateCards(updated)
    },
    [cards, updateCards]
  )

  const addCard = useCallback(
    (term: string, answer: string, chapter: number | null) => {
      const card: Card = {
        id: generateId(),
        term: term.trim(),
        answer: answer.trim(),
        chapter,
        termNumber: null,
        included: true,
      }
      updateCards([...cards, card])
    },
    [cards, updateCards]
  )

  const updateCard = useCallback(
    (id: string, patch: Partial<Pick<Card, 'term' | 'answer' | 'chapter'>>) => {
      const updated = cards.map((c) => (c.id === id ? { ...c, ...patch } : c))
      updateCards(updated)
    },
    [cards, updateCards]
  )

  const deleteCard = useCallback(
    (id: string) => {
      updateCards(cards.filter((c) => c.id !== id))
    },
    [cards, updateCards]
  )

  const activeDeck = cards.filter((c) => c.included)
  const chapters = [...new Set(cards.map((c) => c.chapter).filter((c): c is number => c !== null))].sort(
    (a, b) => a - b
  )

  return {
    cards,
    activeDeck,
    chapters,
    importCards,
    toggleIncluded,
    setAllIncluded,
    addCard,
    updateCard,
    deleteCard,
  }
}

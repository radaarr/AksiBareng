/** Dilempar `requireActor()`; route handler memetakannya ke `401 UNAUTHENTICATED` (docs/API.md §8). */
export class UnauthenticatedError extends Error {
  constructor() {
    super('UNAUTHENTICATED')
    this.name = 'UnauthenticatedError'
  }
}

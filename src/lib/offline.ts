import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OfflineDB extends DBSchema {
  pendingForms: {
    key: string
    value: {
      id: string
      data: Record<string, unknown>
      savedAt: number
      step: number
    }
  }
}

let db: IDBPDatabase<OfflineDB> | null = null

export async function getOfflineDB() {
  if (typeof window === 'undefined') return null
  if (!db) {
    db = await openDB<OfflineDB>('adp-offline', 1, {
      upgrade(db) {
        db.createObjectStore('pendingForms', { keyPath: 'id' })
      },
    })
  }
  return db
}

export async function saveFormOffline(id: string, data: Record<string, unknown>, step: number) {
  const database = await getOfflineDB()
  if (!database) return
  await database.put('pendingForms', { id, data, savedAt: Date.now(), step })
}

export async function loadFormOffline(id: string) {
  const database = await getOfflineDB()
  if (!database) return null
  return database.get('pendingForms', id)
}

export async function clearFormOffline(id: string) {
  const database = await getOfflineDB()
  if (!database) return
  await database.delete('pendingForms', id)
}

export async function getAllPendingForms() {
  const database = await getOfflineDB()
  if (!database) return []
  return database.getAll('pendingForms')
}

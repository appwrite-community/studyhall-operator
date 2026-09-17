import { Permission, Role, TablesDB, Storage, type Client } from 'node-appwrite'

export const DATABASE_ID = 'classroom'
export const BUCKET_ID = 'materials'

/**
 * The shape every school gets. Course content is readable by anyone signed in
 * to that school. Questions are not: they carry the correct answer, so only the
 * site's own server key ever reads them.
 */
export async function createSchema(client: Client) {
  const db = new TablesDB(client)
  const storage = new Storage(client)

  await db.create({ databaseId: DATABASE_ID, name: 'Classroom' })

  const readable = [Permission.read(Role.users())]

  await db.createTable({
    databaseId: DATABASE_ID,
    tableId: 'courses',
    name: 'Courses',
    permissions: readable,
    rowSecurity: false,
  })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'courses', key: 'title', size: 160, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'courses', key: 'summary', size: 400, required: false })
  await db.createIntegerColumn({ databaseId: DATABASE_ID, tableId: 'courses', key: 'position', required: false, xdefault: 0 })

  await db.createTable({
    databaseId: DATABASE_ID,
    tableId: 'lessons',
    name: 'Lessons',
    permissions: readable,
    rowSecurity: false,
  })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'lessons', key: 'courseId', size: 64, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'lessons', key: 'title', size: 160, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'lessons', key: 'body', size: 20000, required: true })
  await db.createIntegerColumn({ databaseId: DATABASE_ID, tableId: 'lessons', key: 'position', required: false, xdefault: 0 })

  await db.createTable({
    databaseId: DATABASE_ID,
    tableId: 'materials',
    name: 'Materials',
    permissions: readable,
    rowSecurity: false,
  })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'materials', key: 'courseId', size: 64, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'materials', key: 'title', size: 160, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'materials', key: 'fileId', size: 64, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'materials', key: 'filename', size: 200, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'materials', key: 'mimeType', size: 128, required: false })
  await db.createIntegerColumn({ databaseId: DATABASE_ID, tableId: 'materials', key: 'sizeBytes', required: false, xdefault: 0 })

  await db.createTable({
    databaseId: DATABASE_ID,
    tableId: 'quizzes',
    name: 'Quizzes',
    permissions: readable,
    rowSecurity: false,
  })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'quizzes', key: 'courseId', size: 64, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'quizzes', key: 'title', size: 160, required: true })

  // No read permission for users. The answer key stays on the server side.
  await db.createTable({
    databaseId: DATABASE_ID,
    tableId: 'questions',
    name: 'Questions',
    permissions: [],
    rowSecurity: false,
  })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'questions', key: 'quizId', size: 64, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'questions', key: 'prompt', size: 600, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'questions', key: 'options', size: 300, required: false, array: true })
  await db.createIntegerColumn({ databaseId: DATABASE_ID, tableId: 'questions', key: 'correctIndex', required: false, xdefault: 0 })
  await db.createIntegerColumn({ databaseId: DATABASE_ID, tableId: 'questions', key: 'position', required: false, xdefault: 0 })

  // Results are written by the site and read back by the student who sat the quiz.
  await db.createTable({
    databaseId: DATABASE_ID,
    tableId: 'attempts',
    name: 'Attempts',
    permissions: [],
    rowSecurity: true,
  })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'attempts', key: 'studentId', size: 64, required: true })
  await db.createStringColumn({ databaseId: DATABASE_ID, tableId: 'attempts', key: 'quizId', size: 64, required: true })
  await db.createIntegerColumn({ databaseId: DATABASE_ID, tableId: 'attempts', key: 'score', required: false, xdefault: 0 })
  await db.createIntegerColumn({ databaseId: DATABASE_ID, tableId: 'attempts', key: 'total', required: false, xdefault: 0 })

  await storage.createBucket({
    bucketId: BUCKET_ID,
    name: 'Course materials',
    permissions: [],
    fileSecurity: false,
    // Course video is the heaviest thing a school uploads, and the largest part
    // of what they are billed for.
    maximumFileSize: 512 * 1000 * 1000,
  })
}

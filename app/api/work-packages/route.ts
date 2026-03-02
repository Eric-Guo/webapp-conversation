import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const TODO_ENDPOINT = 'https://plm.thape.com.cn/my_todo.json'

interface PlmWorkPackage {
  work_package_id?: string | number
  subject?: string
  disabled?: boolean
}

interface PlmProject {
  name?: string
  work_packages?: PlmWorkPackage[]
}

interface PlmGroupedDay {
  projects?: PlmProject[]
}

interface WorkPackageOption {
  value: string
  label: string
}

interface PlmPayload {
  grouped_by_date?: Record<string, PlmGroupedDay>
}

const normalizeOption = (projectName?: string, subject?: string, value?: string) => {
  const label = [projectName?.trim(), subject?.trim()].filter(Boolean).join(' ')
  return {
    value: value || '',
    label: label || value || '',
  }
}

const getFirstNameCandidates = (name?: string | null, email?: string | null) => {
  const seen = new Set<string>()
  const candidates: string[] = []

  const appendCandidate = (candidate?: string | null) => {
    if (typeof candidate !== 'string') { return }
    const normalized = candidate.trim()
    if (!normalized) { return }
    const dedupedKey = normalized.toLowerCase()
    if (seen.has(dedupedKey)) { return }
    seen.add(dedupedKey)
    candidates.push(normalized)
  }

  appendCandidate(name)

  const nameLocalPart = typeof name === 'string' && name.includes('@') ? name.split('@')[0] : ''
  appendCandidate(nameLocalPart)

  const emailLocalPart = typeof email === 'string' && email.includes('@') ? email.split('@')[0] : ''
  appendCandidate(emailLocalPart)

  return candidates
}

const extractOptionsFromPayload = (payload?: PlmPayload) => {
  const groupedByDate = payload?.grouped_by_date || {}
  const optionMap = new Map<string, WorkPackageOption>()

  Object.values(groupedByDate).forEach((group) => {
    const projects = Array.isArray(group?.projects) ? group.projects : []

    projects.forEach((project) => {
      const projectName = typeof project?.name === 'string' ? project.name : ''
      const workPackages = Array.isArray(project?.work_packages) ? project.work_packages : []

      workPackages.forEach((workPackage) => {
        if (workPackage?.disabled) { return }

        const rawId = workPackage?.work_package_id
        if (rawId === undefined || rawId === null || rawId === '') { return }

        const value = String(rawId)
        if (optionMap.has(value)) { return }

        const option = normalizeOption(
          projectName,
          typeof workPackage?.subject === 'string' ? workPackage.subject : '',
          value,
        )

        optionMap.set(value, option)
      })
    })
  })

  return Array.from(optionMap.values())
}

export async function GET() {
  const session = await auth()
  const clerkCode = session?.user?.clerk_code?.trim()
  const firstNameCandidates = getFirstNameCandidates(session?.user?.name, session?.user?.email)

  if (!clerkCode || !firstNameCandidates.length) { return NextResponse.json({ data: [] }) }

  try {
    let lastFailureStatus: number | null = null
    let latestSuccessfulEmptyOptions: WorkPackageOption[] | null = null

    for (const firstName of firstNameCandidates) {
      const params = new URLSearchParams({
        clerk_code: clerkCode,
        first_name: firstName,
      })
      const response = await fetch(`${TODO_ENDPOINT}?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })

      if (!response.ok) {
        lastFailureStatus = response.status
        continue
      }

      try {
        const payload = await response.json() as PlmPayload
        const options = extractOptionsFromPayload(payload)

        if (options.length) { return NextResponse.json({ data: options }) }

        latestSuccessfulEmptyOptions = options
      }
      catch {
        lastFailureStatus = 500
      }
    }

    if (latestSuccessfulEmptyOptions) { return NextResponse.json({ data: latestSuccessfulEmptyOptions }) }
    if (lastFailureStatus) {
      return NextResponse.json({ error: 'Failed to fetch work packages', data: [] }, { status: lastFailureStatus })
    }

    return NextResponse.json({ data: [] })
  }
  catch {
    return NextResponse.json({ error: 'Failed to fetch work packages', data: [] }, { status: 500 })
  }
}

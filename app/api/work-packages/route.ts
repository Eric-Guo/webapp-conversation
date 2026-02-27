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

const normalizeOption = (projectName?: string, subject?: string, value?: string) => {
  const label = [projectName?.trim(), subject?.trim()].filter(Boolean).join(' ')
  return {
    value: value || '',
    label: label || value || '',
  }
}

export async function GET() {
  const session = await auth()
  const clerkCode = session?.user?.clerk_code?.trim()
  const firstName = session?.user?.name?.trim()

  if (!clerkCode || !firstName) { return NextResponse.json({ data: [] }) }

  const params = new URLSearchParams({
    clerk_code: clerkCode,
    first_name: firstName,
  })

  try {
    const response = await fetch(`${TODO_ENDPOINT}?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch work packages', data: [] }, { status: response.status })
    }

    const payload = await response.json() as { grouped_by_date?: Record<string, PlmGroupedDay> }
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

    return NextResponse.json({ data: Array.from(optionMap.values()) })
  }
  catch {
    return NextResponse.json({ error: 'Failed to fetch work packages', data: [] }, { status: 500 })
  }
}

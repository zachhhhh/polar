'use client'

import { useCurrentOrgAndRepoFromURL } from '@/hooks'
import { ArrowBackOutlined } from '@mui/icons-material'
import { Organization } from '@polar-sh/sdk'
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import { useCallback, useEffect, useMemo } from 'react'
import { CommandItem } from './CommandItem'
import { APICommand, CommandType } from './commands/commands'
import { ScopeType } from './commands/scopes'
import {
  CommandPaletteContextProvider,
  useCommands,
} from './commands/useCommands'
import { APIContainer } from './containers/APIContainer'
import { GlobalContainer } from './containers/GlobalContainer'

export interface CommandPaletteProps {
  organization?: Organization
  hide: () => void
}

export const CommandPalette = ({ organization, hide }: CommandPaletteProps) => {
  return (
    <CommandPaletteContextProvider
      organization={organization}
      hideCommandPalette={hide}
    >
      <div className="dark:bg-polar-900 dark:border-polar-800 flex w-full flex-grow flex-col overflow-hidden rounded-3xl border bg-gray-100">
        <CommandPaletteInput />
        <CommandPaletteContainer />
      </div>
    </CommandPaletteContextProvider>
  )
}

const CommandPaletteInput = () => {
  const { scope, input, setInput, setScopeKeys } = useCommands()

  const renderBackButton = useMemo(
    () => scope?.type === ScopeType.Isolated,
    [scope],
  )

  const handleBack = useCallback(() => {
    setScopeKeys((scopeKeys) => scopeKeys.slice(0, -1))
  }, [setScopeKeys])

  return (
    <div className="dark:bg-polar-950 dark:border-polar-800 flex flex-row gap-x-4 border-b border-gray-200 bg-white px-8 py-6">
      {renderBackButton && (
        <div
          className="dark:bg-polar-700 dark:hover:bg-polar-600 flex aspect-square h-full flex-shrink-0 flex-col items-center justify-center rounded-lg bg-gray-200 transition-colors hover:cursor-pointer hover:bg-gray-100"
          onClick={handleBack}
        >
          <ArrowBackOutlined fontSize="inherit" />
        </div>
      )}
      <input
        className="dark:text-polar-50 dark:placeholder:text-polar-500 w-full border-none bg-transparent p-0 text-xl text-gray-950 placeholder:text-gray-400 focus:border-none focus:outline-none focus:ring-0"
        placeholder="Enter Command..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
      />
    </div>
  )
}

const CommandPaletteContainer = () => {
  const { scopes, scope, setScopeKeys } = useCommands()
  const pathname = usePathname()

  useEffect(() => {
    const scopeCandidate = scopes.find((s) =>
      pathname.includes(s.name.replace('api:', '')),
    )

    if (scopeCandidate) {
      setScopeKeys(['global', scopeCandidate.name])
    }

    // Intentioally omitting dependencies to only run on mount
  }, [])

  const container = useMemo(() => {
    switch (scope?.name.split(':')[0]) {
      case 'api':
        return <APINavigator />
      default:
        return <GlobalContainer />
    }
  }, [scope])

  return container
}

const APINavigator = () => {
  const { commands, selectedCommand, setSelectedCommand, hideCommandPalette } =
    useCommands()

  const params = useParams()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { org } = useCurrentOrgAndRepoFromURL()

  const apiEndpoint = useMemo(() => {
    return selectedCommand?.type === CommandType.API ? selectedCommand : null
  }, [selectedCommand])

  const apiCommands = useMemo(
    () => commands.filter((c): c is APICommand => c.type === CommandType.API),
    [commands],
  )

  return (
    <div className="flex h-[360px] flex-grow flex-row">
      <div className="flex h-full w-72 flex-shrink-0 flex-col gap-y-1 overflow-y-scroll p-4">
        {apiCommands.map((command, index) => {
          return (
            <CommandItem
              key={command.id}
              command={command.name}
              description={command.description}
              onClick={() => {
                setSelectedCommand(command)

                command.action?.({
                  params,
                  searchParams,
                  pathname,
                  router,
                  organization: org,
                  hidePalette: hideCommandPalette,
                })
              }}
              active={selectedCommand === command}
            >
              <span className="py-.5 rounded-sm bg-blue-50 px-2 font-mono text-[9px] uppercase text-blue-500 dark:bg-blue-950 dark:text-blue-200">
                {command.method}
              </span>
            </CommandItem>
          )
        })}
      </div>
      <div className="flex h-full w-full flex-row py-4 pr-4">
        {apiEndpoint && (
          <APIContainer
            operation={apiEndpoint.operation}
            method={apiEndpoint.method}
            path={apiEndpoint.endpointPath}
          />
        )}
      </div>
    </div>
  )
}

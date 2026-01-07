import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { Modal } from './components/Modal'
import { Badge, Button, Field, Input, Select, Textarea } from './components/ui'
import { ApiError, createFlag, deleteFlag, getFlags, toggleFlag, updateFlag } from './lib/api'
import type { CreateFlagRequest, Environment, FeatureFlag, GetFlagsResponse, UpdateFlagRequest } from './lib/types'
import { cx, formatEnv, kebabCaseRegex } from './lib/utils'

type EnabledFilter = 'all' | 'enabled' | 'disabled'

function App() {
  const qc = useQueryClient()

  const [environment, setEnvironment] = useState<'all' | Environment>('all')
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editFlagState, setEditFlagState] = useState<FeatureFlag | null>(null)
  const [deleteFlagState, setDeleteFlagState] = useState<FeatureFlag | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const enabled = useMemo(() => {
    if (enabledFilter === 'all') return undefined
    return enabledFilter === 'enabled'
  }, [enabledFilter])

  const flagsQueryKey = useMemo(
    () => ['flags', { environment, enabled, search }] as const,
    [environment, enabled, search],
  )

  const flagsQuery = useQuery({
    queryKey: flagsQueryKey,
    queryFn: () => getFlags({ environment, enabled, search }),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleFlag(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: flagsQueryKey })
      const prev = qc.getQueryData<GetFlagsResponse>(flagsQueryKey)

      qc.setQueryData<GetFlagsResponse>(flagsQueryKey, (curr) => {
        if (!curr) return curr
        return {
          ...curr,
          data: curr.data.map((f: FeatureFlag) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
        }
      })

      return { prev }
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(flagsQueryKey, ctx.prev)
      // If the backend restarted (in-memory store), old IDs can 404.
      // Auto-refresh the list so the UI recovers immediately.
      if (err instanceof ApiError && err.code === 'NOT_FOUND') {
        qc.invalidateQueries({ queryKey: ['flags'] })
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['flags'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: createFlag,
    onSuccess: () => {
      setCreateOpen(false)
      qc.invalidateQueries({ queryKey: ['flags'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFlagRequest }) => updateFlag(id, body),
    onSuccess: (res) => {
      setEditFlagState(null)
      qc.setQueryData<GetFlagsResponse>(flagsQueryKey, (curr) => {
        if (!curr) return curr
        return { ...curr, data: curr.data.map((f: FeatureFlag) => (f.id === res.data.id ? res.data : f)) }
      })
      qc.invalidateQueries({ queryKey: ['flags'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFlag(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: flagsQueryKey })
      const prev = qc.getQueryData<GetFlagsResponse>(flagsQueryKey)
      qc.setQueryData<GetFlagsResponse>(flagsQueryKey, (curr) => {
        if (!curr) return curr
        return { ...curr, data: curr.data.filter((f: FeatureFlag) => f.id !== id) }
      })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(flagsQueryKey, ctx.prev)
    },
    onSuccess: () => {
      setDeleteFlagState(null)
      qc.invalidateQueries({ queryKey: ['flags'] })
    },
  })

  const topError =
    (flagsQuery.error as unknown) ||
    (toggleMutation.error as unknown) ||
    (createMutation.error as unknown) ||
    (updateMutation.error as unknown) ||
    (deleteMutation.error as unknown)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Feature Flag Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">Manage flags across environments (local API on :8080).</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create flag</Button>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <Field label="Environment">
                <Select value={environment} onChange={(e) => setEnvironment(e.target.value as 'all' | Environment)}>
                  <option value="all">All</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </Select>
              </Field>
            </div>

            <div className="md:col-span-3">
              <Field label="Enabled">
                <Select value={enabledFilter} onChange={(e) => setEnabledFilter(e.target.value as EnabledFilter)}>
                  <option value="all">All</option>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </Select>
              </Field>
            </div>

            <div className="md:col-span-6">
          <Field label="Search" hint="Matches name, key, or description">
                <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="e.g. dark-mode" />
              </Field>
            </div>
          </div>
        </div>

        {topError ? (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {topError instanceof ApiError ? (
              <div>
                <div className="font-medium">{topError.code}</div>
                <div className="mt-0.5">{topError.message}</div>
              </div>
            ) : (
              'Something went wrong. Check the console for details.'
            )}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-slate-950">
          <div className="grid grid-cols-12 gap-3 border-b border-white/10 px-4 py-3 text-xs font-medium text-slate-400">
            <div className="col-span-4">Flag</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Environment</div>
            <div className="col-span-2">Owner</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {flagsQuery.isLoading ? (
            <div className="px-4 py-6 text-sm text-slate-300">Loading flags…</div>
          ) : flagsQuery.data?.data?.length ? (
            <div className="divide-y divide-white/5">
              {flagsQuery.data.data.map((flag) => (
                <div key={flag.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
                  <div className="col-span-4">
                    <div className="text-sm font-medium text-white">{flag.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-slate-400">{flag.key}</div>
                    {flag.description ? (
                      <div className="mt-1 line-clamp-2 text-xs text-slate-300">{flag.description}</div>
                    ) : null}
                  </div>

                  <div className="col-span-2">
                    <Badge tone={flag.enabled ? 'green' : 'red'}>{flag.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  </div>

                  <div className="col-span-2">
                    <Badge tone="amber">{formatEnv(flag.environment)}</Badge>
                  </div>

                  <div className="col-span-2 text-sm text-slate-200">{flag.metadata.owner}</div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className={cx(
                        'h-6 w-11 rounded-full border transition',
                        flag.enabled ? 'border-emerald-400/40 bg-emerald-500/30' : 'border-white/10 bg-white/5',
                      )}
                      onClick={() => toggleMutation.mutate(flag.id)}
                      aria-label="Toggle enabled"
                      disabled={toggleMutation.isPending}
                    >
                      <span
                        className={cx(
                          'block h-5 w-5 translate-x-0.5 rounded-full bg-white transition',
                          flag.enabled ? 'translate-x-[1.35rem]' : 'translate-x-0.5',
                        )}
                      />
                    </button>

                    <Button variant="ghost" className="px-2" onClick={() => setEditFlagState(flag)} aria-label="Edit flag">
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      className="px-2 text-rose-200 hover:text-white"
                      onClick={() => setDeleteFlagState(flag)}
                      aria-label="Delete flag"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-sm text-slate-300">No flags match your filters.</div>
          )}

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-slate-400">
            <div>Total: {flagsQuery.data?.meta?.total ?? 0}</div>
            <div className="flex gap-3">
              <span>dev: {flagsQuery.data?.meta?.environments?.development ?? 0}</span>
              <span>staging: {flagsQuery.data?.meta?.environments?.staging ?? 0}</span>
              <span>prod: {flagsQuery.data?.meta?.environments?.production ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {createOpen ? (
        <CreateFlagModal
          onClose={() => setCreateOpen(false)}
          onCreate={(body) => createMutation.mutate(body)}
          pending={createMutation.isPending}
        />
      ) : null}

      {editFlagState ? (
        <EditFlagModal
          key={editFlagState.id}
          flag={editFlagState}
          onClose={() => setEditFlagState(null)}
          onSave={(id, body) => updateMutation.mutate({ id, body })}
          pending={updateMutation.isPending}
        />
      ) : null}

      {deleteFlagState ? (
        <ConfirmDeleteModal
          key={deleteFlagState.id}
          flag={deleteFlagState}
          onClose={() => setDeleteFlagState(null)}
          onConfirm={(id) => deleteMutation.mutate(id)}
          pending={deleteMutation.isPending}
        />
      ) : null}
    </div>
  )
}

function CreateFlagModal(props: {
  onClose: () => void
  onCreate: (body: CreateFlagRequest) => void
  pending: boolean
}) {
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [environment, setEnvironment] = useState<Environment>('development')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  const submit = () => {
    setClientError(null)
    if (!key.trim() || !name.trim()) {
      setClientError('Key and name are required.')
      return
    }
    if (!kebabCaseRegex.test(key.trim())) {
      setClientError('Key must be kebab-case (lowercase letters, numbers, hyphens only).')
      return
    }
    props.onCreate({
      key: key.trim(),
      name: name.trim(),
      environment,
      description: description.trim() ? description.trim() : null,
      metadata: owner.trim() ? { owner: owner.trim() } : undefined,
    })
  }

  return (
    <Modal
      open={true}
      title="Create feature flag"
      onClose={props.onClose}
      footer={
        <>
          <Button variant="ghost" onClick={props.onClose} disabled={props.pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={props.pending}>
            {props.pending ? 'Creating…' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {clientError ? (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {clientError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Key" hint="kebab-case, e.g. my-new-flag">
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="my-new-flag" />
          </Field>
          <Field label="Environment">
            <Select value={environment} onChange={(e) => setEnvironment(e.target.value as Environment)}>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </Select>
          </Field>
        </div>

        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Human readable name" />
        </Field>

        <Field label="Description (optional)">
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this flag do?"
          />
        </Field>

        <Field label="Owner (optional)">
          <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="frontend-team" />
        </Field>
      </div>
    </Modal>
  )
}

function EditFlagModal(props: {
  flag: FeatureFlag
  onClose: () => void
  onSave: (id: string, body: UpdateFlagRequest) => void
  pending: boolean
}) {
  const flag = props.flag
  const [name, setName] = useState(() => flag.name)
  const [environment, setEnvironment] = useState<Environment>(() => flag.environment)
  const [description, setDescription] = useState(() => flag.description ?? '')
  const [owner, setOwner] = useState(() => flag.metadata.owner ?? '')

  const submit = () => {
    props.onSave(flag.id, {
      name: name.trim(),
      environment,
      description: description.trim() ? description.trim() : null,
      metadata: { owner: owner.trim() || 'unassigned' },
    })
  }

  return (
    <Modal
      open={true}
      title={flag ? `Edit: ${flag.key}` : 'Edit flag'}
      onClose={props.onClose}
      footer={
        <>
          <Button variant="ghost" onClick={props.onClose} disabled={props.pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={props.pending}>
            {props.pending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="text-xs text-slate-400">
          Key is immutable: <span className="font-mono text-slate-300">{flag.key}</span>
        </div>

        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Environment">
            <Select value={environment} onChange={(e) => setEnvironment(e.target.value as Environment)}>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </Select>
          </Field>
          <Field label="Owner">
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </Field>
        </div>

        <Field label="Description">
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function ConfirmDeleteModal(props: {
  flag: FeatureFlag
  onClose: () => void
  onConfirm: (id: string) => void
  pending: boolean
}) {
  const flag = props.flag
  return (
    <Modal
      open={true}
      title="Delete feature flag"
      onClose={props.onClose}
      widthClassName="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={props.onClose} disabled={props.pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => (flag ? props.onConfirm(flag.id) : null)}
            disabled={!flag || props.pending}
          >
            {props.pending ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-200">
        Are you sure you want to delete <span className="font-semibold text-white">{flag.name}</span> (
        <span className="font-mono">{flag.key}</span>) from <span className="font-semibold">{formatEnv(flag.environment)}</span>?
      </div>
    </Modal>
  )
}

export default App

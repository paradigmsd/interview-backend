import { useState } from 'react';
import type { Environment } from '@repo/types';
import { useFlags } from '../hooks/useFlags';
import { FlagFilters, FlagList, CreateFlagDialog } from '../components/FlagComponents';

export function FlagDashboard() {
  const [environment, setEnvironment] = useState<Environment | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useFlags({
    environment: environment === 'all' ? undefined : environment,
    search: search || undefined,
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-gray-600 mt-1">
            Manage feature flags across all environments
          </p>
        </div>
        <CreateFlagDialog />
      </div>

      <FlagFilters
        environment={environment}
        search={search}
        onEnvironmentChange={setEnvironment}
        onSearchChange={setSearch}
      />

      {isLoading && (
        <div className="text-center py-12 text-gray-500">Loading flags...</div>
      )}

      {error && (
        <div className="text-center py-12 text-red-600">
          Error loading flags: {error.message}
        </div>
      )}

      {data && <FlagList flags={data.data} />}

      {data && (
        <div className="mt-6 text-sm text-gray-500 text-center">
          Showing {data.data.length} of {data.meta.total} flags
        </div>
      )}
    </div>
  );
}

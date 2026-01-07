import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FeatureFlag, Environment, CreateFlagRequest } from '@repo/types';
import { CreateFlagRequestSchema } from '@repo/types';
import { ApiClientError } from '@repo/api-client';
import { useFlagToggle } from '../hooks/useFlagToggle';
import { useCreateFlag } from '../hooks/useCreateFlag';
import {
  Button,
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Badge,
  Card,
  CardContent,
} from './ui';

// FlagFilters Component
interface FlagFiltersProps {
  environment: Environment | 'all';
  search: string;
  onEnvironmentChange: (env: Environment | 'all') => void;
  onSearchChange: (search: string) => void;
}

export function FlagFilters({
  environment,
  search,
  onEnvironmentChange,
  onSearchChange,
}: FlagFiltersProps) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="w-64">
        <Select
          value={environment}
          onValueChange={(value) => onEnvironmentChange(value as Environment | 'all')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Environments</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Input
          type="text"
          placeholder="Search by name or key..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// FlagToggle Component
interface FlagToggleProps {
  flagId: string;
  enabled: boolean;
}

export function FlagToggle({ flagId, enabled }: FlagToggleProps) {
  const { mutate: toggle, isPending } = useFlagToggle();

  return (
    <Switch
      checked={enabled}
      onCheckedChange={() => toggle(flagId)}
      disabled={isPending}
    />
  );
}

// FlagListItem Component
interface FlagListItemProps {
  flag: FeatureFlag;
}

export function FlagListItem({ flag }: FlagListItemProps) {
  const environmentColors: Record<Environment, string> = {
    development: 'bg-blue-100 text-blue-800 border-blue-200',
    staging: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    production: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-lg">{flag.name}</h3>
            <Badge className={environmentColors[flag.environment]}>
              {flag.environment}
            </Badge>
            <Badge variant={flag.enabled ? 'default' : 'secondary'}>
              {flag.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            Key: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{flag.key}</code>
          </p>
          {flag.description && (
            <p className="text-sm text-gray-500">{flag.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Owner: {flag.metadata.owner}
          </p>
        </div>

        <div className="ml-4">
          <FlagToggle flagId={flag.id} enabled={flag.enabled} />
        </div>
      </CardContent>
    </Card>
  );
}

// FlagList Component
interface FlagListProps {
  flags: FeatureFlag[];
}

export function FlagList({ flags }: FlagListProps) {
  if (flags.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No feature flags found. Create one to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flags.map((flag) => (
        <FlagListItem key={flag.id} flag={flag} />
      ))}
    </div>
  );
}

// CreateFlagForm Component
interface CreateFlagFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateFlagForm({ onSuccess, onCancel }: CreateFlagFormProps) {
  const { mutate: createFlag, isPending, error } = useCreateFlag();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateFlagRequest>({
    resolver: zodResolver(CreateFlagRequestSchema),
    defaultValues: {
      key: '',
      name: '',
      description: null,
      enabled: false,
      environment: 'development',
      metadata: {
        owner: 'unassigned',
        tags: [],
      },
    },
  });

  const environment = watch('environment');

  const onSubmit = (data: CreateFlagRequest) => {
    createFlag(data, {
      onSuccess: () => {
        reset();
        onSuccess();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="key">Key *</Label>
        <Input
          id="key"
          placeholder="my-feature-flag"
          {...register('key')}
        />
        {errors.key && (
          <p className="text-sm text-red-600">{errors.key.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="My Feature Flag"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="environment">Environment *</Label>
        <Select value={environment} onValueChange={(value) => setValue('environment', value as Environment)}>
          <SelectTrigger>
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>
        {errors.environment && (
          <p className="text-sm text-red-600">{errors.environment.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Optional description"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner">Owner</Label>
        <Input
          id="owner"
          placeholder="unassigned"
          {...register('metadata.owner')}
        />
        {errors.metadata?.owner && (
          <p className="text-sm text-red-600">{errors.metadata.owner.message}</p>
        )}
      </div>

      {error && error instanceof ApiClientError && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error.error.message}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Flag'}
        </Button>
      </div>
    </form>
  );
}

// CreateFlagDialog Component
export function CreateFlagDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Flag</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Feature Flag</DialogTitle>
        </DialogHeader>
        <CreateFlagForm
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

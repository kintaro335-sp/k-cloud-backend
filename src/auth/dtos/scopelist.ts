import { Scope } from '../../sessions/interfaces/session.interface';

const scopes: Scope[] = [
  'files:create',
  'files:delete',
  'files:rename',
  'files:move',
  'files:read',
  'tokens:create',
  'tokens:delete',
  'tokens:update',
  'tokens:read',
  'admin:users',
  'admin:activity-read',
  'admin:memory-usage',
  'admin:manage-options',
  'admin:stats',
  'auth:read-api-keys',
  'auth:create-api-keys',
  'auth:read-sessions',
  'auth:delete-sessions',
  'auth:edit-api-keys'
];

function createScopesObjectEnum() {
  const scopesObject: { [key: string]: string } = {};
  scopes.forEach((scope) => {
    scopesObject[scope] = scope;
  });
  return scopesObject;
}

const ScopesEnum = createScopesObjectEnum();

export { scopes, ScopesEnum };

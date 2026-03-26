import { User } from '../types/user';

const users: Map<string, User> = new Map([
  [
    'user-001',
    {
      uid: 'user-001',
      productId: 1,
      campaignId: 42,
      brandId: 10,
      createdAt: new Date('2025-01-15'),
      searchDomain: 'search.example.com',
      brandToken: 'tok_abc123',
    },
  ],
  [
    'user-002',
    {
      uid: 'user-002',
      productId: 2,
      campaignId: 99,
      brandId: 20,
      createdAt: new Date('2025-03-10'),
      searchDomain: 'find.demo.io',
      brandToken: 'tok_xyz789',
    },
  ],
]);

export function getUser(uid: string): User | undefined {
  return users.get(uid);
}

'use client';
import {createAuthClient} from 'better-auth/react';
export const identityClient = createAuthClient({basePath: '/api/identity'});

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import useAuthStore from '@/lib/store';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Home() {
  const { loginWithGoogle } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8eaf6] via-[#f5f7fa] to-[#e3f2fd]">
      <Card className="w-[380px] rounded-2xl shadow-xl border border-gray-100 bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold mb-2 text-[#374151] tracking-tight">
            Welcome to <span className="text-[#5c6bc0]">Solomax-Workflows</span>
          </CardTitle>
          <CardDescription className="text-center text-[#6b7280] text-base font-normal">
            Enterprise workflow management platform for seamless collaboration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full flex items-center py-5 justify-center gap-3 bg-gradient-to-r from-[#b3c0f7] to-[#b2dfdb] text-[#374151] hover:from-[#a5b4fc] hover:to-[#80cbc4] shadow-md rounded-lg transition-all duration-200 focus:ring-2 focus:ring-[#b3c0f7] focus:outline-none"
            onClick={loginWithGoogle}
            aria-label="Sign in with Google"
          >
            <span className="flex items-center justify-center bg-white rounded-full p-1 shadow-lg transition-transform duration-150 hover:scale-110">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </span>
            <span className="font-medium text-base">Sign in with Google</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

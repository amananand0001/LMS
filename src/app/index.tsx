import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

export default function IndexPage() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <LoadingOverlay visible />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(main)' : '/(auth)/login'} />;
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Clock, LogOut, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Africa/Cairo',
  'America/Sao_Paulo',
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    timezone: 'UTC',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        timezone: profile.timezone || 'UTC',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; timezone?: string }) =>
      api.updateProfile(data),
    onSuccess: async () => {
      toast.success(t('profile.profileUpdatedSuccess') || 'Profile updated successfully!');
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('profile.failedToUpdateProfile') || 'Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      timezone: formData.timezone,
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success(t('auth.loggedOut') || 'Logged out successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back') || 'Back to Dashboard'}
        </Button>

        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.profileInformation') || 'Profile Information'}
              </CardTitle>
              <CardDescription>
                {t('profile.updateYourProfile') || 'Update your personal information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.emailAddress') || 'Email Address'}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || user?.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.emailCannotBeChanged') || 'Email cannot be changed'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('auth.firstName') || 'First Name'}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder={t('auth.firstName') || 'First Name'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('auth.lastName') || 'Last Name'}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder={t('auth.lastName') || 'Last Name'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('profile.timezone') || 'Timezone'}</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) =>
                        setFormData({ ...formData, timezone: value })
                      }
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.timezoneDescription') || 'Select your timezone for accurate reminders'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    className="flex-1 w-full sm:w-auto"
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending
                      ? t('common.loading') || 'Saving...'
                      : t('common.save') || 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.accountInformation') || 'Account Information'}</CardTitle>
              <CardDescription>
                {t('profile.viewYourAccountDetails') || 'View your account details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">
                  {t('profile.emailVerified') || 'Email Verified'}
                </span>
                <span className={`text-sm ${profile?.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {profile?.emailVerified
                    ? t('common.yes') || 'Yes'
                    : t('common.no') || 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">
                  {t('profile.subscriptionTier') || 'Subscription Tier'}
                </span>
                <span className="text-sm text-muted-foreground capitalize">
                  {profile?.subscriptionTier || 'Free'}
                </span>
              </div>
              {profile?.createdAt && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">
                    {t('profile.memberSince') || 'Member Since'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('profile.dangerZone') || 'Danger Zone'}
              </CardTitle>
              <CardDescription>
                {t('profile.dangerZoneDescription') || 'Irreversible and destructive actions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.logout') || 'Logout'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



import AnnouncementsManager from '@/components/AnnouncementsManager'
import { PageHeader } from '@/components/ui'

export default function AnnouncementsPage() {
  return (
    <>
      <PageHeader title="Announcements" subtitle="Publish and manage announcements for the clergy." />
      <AnnouncementsManager role="IT_ADMIN" />
    </>
  )
}
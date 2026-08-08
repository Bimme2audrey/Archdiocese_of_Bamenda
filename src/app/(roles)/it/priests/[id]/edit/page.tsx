import AdminProfileEditor from '@/components/AdminProfileEditor'
import { PageHeader } from '@/components/ui'

export default function EditPriestPage() {
  return (
    <>
      <PageHeader title="Edit Clergy Record" subtitle="Manually update this record without any coding." />
      <AdminProfileEditor role="IT_ADMIN" />
    </>
  )
}
import { toast } from '@/components/Toast/use-toast'
import { useCustomerLicenseKeyDeactivate } from '@/hooks/queries'
import { CloseOutlined } from '@mui/icons-material'
import { LicenseKeyWithActivations, PolarAPI } from '@polar-sh/api'
import Button from '@polar-sh/ui/components/atoms/button'
import FormattedDateTime from '@polar-sh/ui/components/atoms/formatted-date-time'
import { List, ListItem } from '@polar-sh/ui/components/atoms/list'
import { useCallback } from 'react'

interface LicenseKeyActivationsProps {
  api: PolarAPI
  licenseKey: LicenseKeyWithActivations
}

export const LicenseKeyActivations = ({
  api,
  licenseKey,
}: LicenseKeyActivationsProps) => {
  const onDeactivate = useCustomerLicenseKeyDeactivate(api, licenseKey.id)

  const handleDeactivateActivation = useCallback(
    (activationId: string) => () => {
      onDeactivate
        .mutateAsync({
          activationId,
          key: licenseKey.key,
          organizationId: licenseKey.organization_id,
        })
        .then(() => {
          toast({
            title: 'License Key Activation Deleted',
            description: `Activation deleted successfully`,
          })
        })
        .catch((error) => {
          toast({
            title: 'Activation Deactivation Failed',
            description: `Error deactivating activation ${activationId}: ${error.message}`,
          })
        })
    },
    [onDeactivate, licenseKey],
  )

  const hasActivations = (licenseKey?.activations?.length ?? 0) > 0

  if (!hasActivations) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4">
      <h3>Activations</h3>
      <List size="small">
        {licenseKey?.activations.map((activation) => (
          <ListItem key={activation.id} size="small">
            <h3 className="text-sm">{activation.label}</h3>
            <div className="flex flex-row items-center gap-x-4">
              <span className="dark:text-polar-500 text-sm text-gray-500">
                <FormattedDateTime datetime={activation.created_at} />
              </span>
              <Button
                className="h-6 w-6"
                variant="secondary"
                size="icon"
                onClick={handleDeactivateActivation(activation.id)}
              >
                <CloseOutlined fontSize="inherit" />
              </Button>
            </div>
          </ListItem>
        ))}
      </List>
    </div>
  )
}

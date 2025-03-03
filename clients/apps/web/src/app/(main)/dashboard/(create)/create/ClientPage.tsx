'use client'

import revalidate from '@/app/actions'
import { getStatusRedirect } from '@/components/Toast/utils'
import { useAuth } from '@/hooks'
import { usePostHog } from '@/hooks/posthog'
import { useCreateOrganization } from '@/hooks/queries'
import { setValidationErrors } from '@/utils/api/errors'
import { CONFIG } from '@/utils/config'
import { FormControl } from '@mui/material'
import { schemas } from '@polar-sh/client'
import Button from '@polar-sh/ui/components/atoms/Button'
import Input from '@polar-sh/ui/components/atoms/Input'
import ShadowBox from '@polar-sh/ui/components/atoms/ShadowBox'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@polar-sh/ui/components/ui/form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import slugify from 'slugify'

export default function ClientPage({
  slug: initialSlug,
  validationErrors,
  error,
}: {
  slug?: string
  validationErrors?: schemas['ValidationError'][]
  error?: string
}) {
  const posthog = usePostHog()
  const { currentUser, setUserOrganizations, userOrganizations } = useAuth()
  const router = useRouter()
  const form = useForm<{ name: string; slug: string }>({
    defaultValues: { name: initialSlug || '', slug: initialSlug || '' },
  })
  const {
    control,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    setValue,
    formState: { errors },
  } = form
  const createOrganization = useCreateOrganization()
  const [editedSlug, setEditedSlug] = useState(false)

  useEffect(() => {
    posthog.capture('dashboard:organizations:create:view')
  }, [])

  useEffect(() => {
    if (validationErrors) {
      setValidationErrors(validationErrors, setError)
    }
    if (error) {
      setError('root', { message: error })
    } else {
      clearErrors('root')
    }
  }, [validationErrors, error, setError, clearErrors])

  const name = watch('name')
  const slug = watch('slug')

  useEffect(() => {
    if (!editedSlug && name) {
      setValue('slug', slugify(name, { lower: true, strict: true }))
    } else if (slug) {
      setValue(
        'slug',
        slugify(slug, { lower: true, trim: false, strict: true }),
      )
    }
  }, [name, editedSlug, slug, setValue])

  const onSubmit = async (data: { name: string; slug: string }) => {
    const params = {
      ...data,
      slug: slug as string,
    }
    posthog.capture('dashboard:organizations:create:submit', params)
    const { data: organization, error } =
      await createOrganization.mutateAsync(params)
    if (error) {
      if (error.detail) {
        setValidationErrors(error.detail, setError)
      }
      return
    }
    await revalidate(`users:${currentUser?.id}:organizations`)
    setUserOrganizations((orgs) => [...orgs, organization])
    router.push(
      getStatusRedirect(
        `/dashboard/${organization.slug}`,
        'Organization Created',
        `Organization ${organization.name} was created successfully`,
      ),
    )
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-12 py-12">
      <div className="flex flex-col items-center gap-y-6">
        <h1 className="text-3xl font-semibold">Let&apos;s get started</h1>
        <p className="dark:text-polar-400 text-center text-lg text-gray-600">
          To start monetizing on Polar, you need to create an organization.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-y-12"
        >
          <ShadowBox className="flex w-full flex-col gap-y-6">
            <FormField
              control={control}
              name="name"
              rules={{
                required: 'This field is required',
              }}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl className="w-full">
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(slug || editedSlug) && (
              <p className="dark:text-polar-400 w-full text-sm text-gray-600">
                {CONFIG.FRONTEND_BASE_URL}/
                <FormField
                  control={control}
                  name="slug"
                  rules={{
                    required: 'This field is required',
                  }}
                  render={({ field }) => (
                    <>
                      <input
                        type="text"
                        {...field}
                        size={slug?.length || 1}
                        className="dark:bg-polar-700 ml-1 rounded-md border-0 bg-gray-100 px-2 py-1 text-sm text-black focus:outline-none focus:ring-0 dark:text-white"
                        onFocus={() => setEditedSlug(true)}
                      />
                      <FormMessage />
                    </>
                  )}
                />
              </p>
            )}
            {errors.root && (
              <p className="text-destructive-foreground text-sm">
                {errors.root.message}
              </p>
            )}
            <div className="flex flex-row items-center gap-x-4">
              <Button
                className="self-start"
                type="submit"
                loading={createOrganization.isPending}
              >
                Create
              </Button>
              {userOrganizations.length > 0 && (
                <Link href={`/dashboard`}>
                  <Button variant="secondary">Back to Dashboard</Button>
                </Link>
              )}
            </div>
          </ShadowBox>
        </form>
      </Form>
    </div>
  )
}

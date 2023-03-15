import { loadStripe } from '@stripe/stripe-js/pure'
import Checkout from 'components/Website/Checkout'
import type { NextPage } from 'next'
import { api } from 'polarkit'
import { IssuePledge, Platforms } from 'polarkit/api/client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)

const PublicCheckoutPage: NextPage = ({
  organization,
  repository,
  issue,
  query,
}: IssuePledge) => {
  return (
    <>
      <div className="container mx-auto mt-24">
        <h1 className="text-center text-4xl text-gray-800">
          Complete your backing
        </h1>

        <Checkout
          organization={organization}
          repository={repository}
          issue={issue}
          query={query}
          stripePromise={stripePromise}
        />

        <div className="text-center">
          <h4>How does it work?</h4>
          <ul>
            <li>Back</li>
            <li>Track</li>
            <li>Reward</li>
          </ul>
        </div>
      </div>
      {/* <CheckoutForm issueId={issue.id} query={query} /> */}
    </>
  )
}
PublicCheckoutPage.getLayout = (page: ReactElement) => {
  return <div>{page}</div>
}

export const getServerSideProps = async (context) => {
  const res = await api.issues.getPublicIssuePledge({
    platform: Platforms.GITHUB,
    orgName: context.params.organization,
    repoName: context.params.repo,
    number: context.params.number,
  })

  const { organization, repository, issue } = res
  return { props: { organization, repository, issue, query: context.query } }
}

export default PublicCheckoutPage

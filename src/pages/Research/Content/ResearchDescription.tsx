import { format } from 'date-fns'
import {
  Button,
  LinkifyText,
  ModerationStatus,
  UsefulStatsButton,
  Username,
  ViewsCounter,
} from 'oa-components'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ArrowIcon from 'src/assets/icons/icon-arrow-select.svg'
import { AuthWrapper } from 'src/common/AuthWrapper'
import { isUserVerified } from 'src/common/isUserVerified'
import type { IResearch } from 'src/models/research.models'
import type { IUser } from 'src/models/user.models'
import { useResearchStore } from 'src/stores/Research/research.store'
import theme from 'src/themes/styled.theme'
import {
  addIDToSessionStorageArray,
  retrieveSessionStorageArray,
} from 'src/utils/sessionStorage'
import { Box, Flex, Heading, Image, Text } from 'theme-ui'

interface IProps {
  research: IResearch.ItemDB
  isEditable: boolean
  loggedInUser: IUser | undefined
  needsModeration: boolean
  votedUsefulCount?: number
  hasUserVotedUseful: boolean
  moderateResearch: (accepted: boolean) => void
  onUsefulClick: () => void
  onFollowingClick: () => void
}

const ResearchDescription = ({ research, isEditable, ...props }: IProps) => {
  const dateLastUpdateText = (research: IResearch.ItemDB): string => {
    const lastModifiedDate = format(new Date(research._modified), 'DD-MM-YYYY')
    const creationDate = format(new Date(research._created), 'DD-MM-YYYY')
    if (lastModifiedDate !== creationDate) {
      return 'Last update on ' + lastModifiedDate
    } else {
      return ''
    }
  }
  let didInit = false
  const store = useResearchStore()
  const [viewCount, setViewCount] = useState<number | undefined>()

  const incrementViewCount = async () => {
    const sessionStorageArray = retrieveSessionStorageArray('research')

    if (!sessionStorageArray.includes(research._id)) {
      const updatedViewCount = await store.incrementViewCount(research._id)
      setViewCount(updatedViewCount)
      addIDToSessionStorageArray('research', research._id)
    } else {
      setViewCount(research.total_views)
    }
  }

  useEffect(() => {
    if (!didInit) {
      didInit = true
      incrementViewCount()
    }
  }, [research._id])

  return (
    <Flex
      data-cy="research-basis"
      data-id={research._id}
      sx={{
        position: 'relative',
        borderRadius: theme.radii[2] + 'px',
        bg: 'white',
        borderColor: theme.colors.black,
        borderStyle: 'solid',
        borderWidth: '2px',
        overflow: 'hidden',
        flexDirection: ['column-reverse', 'column-reverse', 'row'],
        mt: 4,
      }}
    >
      <Flex px={4} py={4} sx={{ flexDirection: 'column', width: '100%' }}>
        <Flex sx={{ flexWrap: 'wrap', gap: '10px' }}>
          <Link to={'/research'}>
            <Button
              variant="subtle"
              sx={{ fontSize: '14px' }}
              data-cy="go-back"
            >
              <Flex>
                <Image
                  loading="lazy"
                  sx={{
                    width: '10px',
                    marginRight: '4px',
                    transform: 'rotate(90deg)',
                  }}
                  src={ArrowIcon}
                />
                <Text>Back</Text>
              </Flex>
            </Button>
          </Link>
          {props.votedUsefulCount !== undefined && (
            <Box>
              <UsefulStatsButton
                votedUsefulCount={props.votedUsefulCount}
                hasUserVotedUseful={props.hasUserVotedUseful}
                isLoggedIn={props.loggedInUser ? true : false}
                onUsefulClick={props.onUsefulClick}
              />
            </Box>
          )}
          {props.loggedInUser ? (
            <AuthWrapper roleRequired="beta-tester">
              <Button
                icon="thunderbolt"
                variant="outline"
                sx={{
                  fontSize: 2,
                  py: 0,
                  height: '41.5px',
                }}
                onClick={() => {
                  props.onFollowingClick()
                }}
              >
                {research.subscribers?.includes(props?.loggedInUser.userName)
                  ? 'Following'
                  : 'Follow'}
              </Button>
            </AuthWrapper>
          ) : null}
          {viewCount ? (
            <AuthWrapper roleRequired="beta-tester">
              <Box>
                <ViewsCounter viewsCount={viewCount!} />
              </Box>
            </AuthWrapper>
          ) : null}
          {/* Check if research should be moderated */}
          {props.needsModeration && (
            <Flex sx={{ justifyContent: 'space-between' }}>
              <Button
                data-cy={'accept'}
                variant={'primary'}
                icon="check"
                mr={1}
                onClick={() => props.moderateResearch(true)}
              />
              <Button
                data-cy="reject-research"
                variant={'outline'}
                icon="delete"
                onClick={() => props.moderateResearch(false)}
              />
            </Flex>
          )}
          {/* Show edit button for the creator of the research OR a super-admin */}
          {isEditable && (
            <Link to={'/research/' + research.slug + '/edit'}>
              <Button variant={'primary'} data-cy={'edit'}>
                Edit
              </Button>
            </Link>
          )}
        </Flex>
        <Box mt={3} mb={2}>
          <Flex sx={{ alignItems: 'center' }}>
            <Flex sx={{ alignItems: 'center' }}>
              <Username
                user={{
                  userName: research._createdBy,
                  countryCode: research.creatorCountry,
                }}
                isVerified={isUserVerified(research._createdBy)}
              />
              <Text
                sx={{
                  ...theme.typography.auxiliary,
                  marginTop: 2,
                  marginBottom: 2,
                }}
              >
                Started on {format(new Date(research._created), 'DD-MM-YYYY')}
              </Text>
            </Flex>
          </Flex>
          <Text
            sx={{
              ...theme.typography.auxiliary,
              color: `${theme.colors.lightgrey} !important`,
            }}
            mt={1}
            mb={2}
          >
            {dateLastUpdateText(research)}
          </Text>
          <Heading mt={2} mb={1}>
            {research.title}
          </Heading>
          <Text sx={{ whiteSpace: 'pre-line', ...theme.typography.paragraph }}>
            <LinkifyText>{research.description}</LinkifyText>
          </Text>
        </Box>
      </Flex>
      {research.moderation !== 'accepted' && (
        <ModerationStatus
          status={research.moderation}
          contentType="research"
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
          }}
        />
      )}
    </Flex>
  )
}

export default ResearchDescription

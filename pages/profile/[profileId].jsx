// api
import { ProfileApi } from 'asset/api'

// api url
import {
  PROFILE_HOST_ENDPOINT,
  PROFILE_HOST_API,
  PROFILE_LIST_HOST_API
} from 'asset/constant'

/* choose SCSS or Styled-components */
import classes from './profile.module.scss'
import {
  ProfileContainer,
  ProfileUserName,
  ProfileUsernId,
  ProfileBlockField,
  ProfileBlockNumber,
  ProfileDescription
} from 'component/style/profile.style'

// component
import Avatar from 'component/block/avatar'
import FollowShare from 'component/block/followShare'
import Spinner from 'component/block/spinner'

// custom import
import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'

// constant
const headShotSize = 104

const StyledProfileContainer = styled(ProfileContainer)`
  position: relative;
  margin-top: 64px;
  flex-direction: column;
`

const Row = styled.div`
  display: flex;
  width: 80%;

  .text {
    margin-left: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`

const CountRow = styled(Row)`
  margin: 12px 0;
  justify-content: space-around;
`

const PostImg = styled.img`
  width: 100%;
`

const PostListingContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 80%;
`

const StyledSpinner = styled(Spinner)`
  position: relative;
`

const Post = styled.div`
  position: relative;
  width: 33%;
  aspect-ratio: 2 / 3;
`

const PostListing = props => {
  const {
    data: { post_list, page_token }
  } = props
  const [postList, setPostList] = useState(post_list)
  const [currPageToken, setCurrPageToken] = useState(page_token)
  const ref = useRef(null)

  const callback = async (entries) => {
    const [entry] = entries
    console.log(entry)
    if (entry.isIntersecting && currPageToken !== 'NO_MORE_DATA') {
      const headers = { Authorization: PROFILE_HOST_ENDPOINT }

      const listParams = {
        user_id: '!1NMGhCcD3!',
        page_token: currPageToken
      }
      try {
        const url = PROFILE_LIST_HOST_API
        const { data } = await ProfileApi.post(url, listParams, { headers })
        if (!data.error && data) {
          setPostList(I => [...I, ...data.post_list])
          console.log(data.page_token)
          setCurrPageToken(data.page_token)
        } else {
          throw console.log(`hashtagError: ${data.error?.code}`)
        }
      } catch (error) {
        console.log(`error`, error)
      }
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      callback,
      {
        root: document,
        rootMaring: '40px',
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.unobserve(ref.current)
  }, [ref.current, currPageToken])
  
  return (
    <PostListingContainer>
      {postList.map((I, idx) => {
        const imgSrc = I.display_resources.cover_url
        const name = I.geo.poi.name
        return (
          <Post key={I.idx}>
            <PostImg src={imgSrc} />
          </Post>
        )
      })}

      <div ref={ref}>loading</div>
    </PostListingContainer>
  )
}

const Profile = props => {
  // you can get all data from these props
  const { profileInfo, profileList } = props
  // console.log('Profile', profileInfo, profileList)
  const { user, count, profile } = profileInfo
  const avatarProps = {
    level: user.level,
    width: headShotSize,
    height: headShotSize,
    url: user?.head_shot?.small_headshot_url,
    isVerified: !!user?.verified_status
  }

  const following =
    count.following + count.following_hashtag + count.following_location

  return (
    /* choose SCSS or Styled-components */
    <StyledProfileContainer>
      <Row>
        <Avatar {...avatarProps} />
        <div className='text'>
          <ProfileUserName>{user.name}</ProfileUserName>
          <ProfileUsernId>{user.uid}</ProfileUsernId>
        </div>
      </Row>
      <CountRow>
        <div>
          <ProfileBlockNumber>{count.follower}</ProfileBlockNumber>
          <ProfileBlockField>Followers</ProfileBlockField>
        </div>
        <div>
          <ProfileBlockNumber>{following}</ProfileBlockNumber>
          <ProfileBlockField>Following</ProfileBlockField>
        </div>
        <div>
          <ProfileBlockNumber>{count.post}</ProfileBlockNumber>
          <ProfileBlockField>Videos</ProfileBlockField>
        </div>
      </CountRow>
      <Row>
        <FollowShare />
      </Row>
      <Row>
        <ProfileDescription>{profile.public_info.about}</ProfileDescription>
      </Row>
      <PostListing data={profileList} />
    </StyledProfileContainer>
  )
}

export const getServerSideProps = async context => {
  // call API here
  let profileInfo = {}
  let profileList = {}
  const { query } = context
  const { profileId } = query

  const headers = { Authorization: PROFILE_HOST_ENDPOINT }

  // info
  const infoParams = {
    user_id: decodeURIComponent(profileId)
  }

  try {
    const url = PROFILE_HOST_API
    const { data } = await ProfileApi.post(url, infoParams, { headers })
    if (!data.error && data) {
      profileInfo = data
    } else {
      throw console.log(`error: ${data.error?.code}`)
    }
  } catch (error) {
    console.log(`error`, error)
  }

  // list
  const listParams = {
    user_id: decodeURIComponent(profileId),
    page_token: '' // first page is empty
  }

  try {
    const url = PROFILE_LIST_HOST_API
    const { data } = await ProfileApi.post(url, listParams, { headers })
    if (!data.error && data) {
      profileList = data
    } else {
      throw console.log(`hashtagError: ${data.error?.code}`)
    }
  } catch (error) {
    console.log(`error`, error)
  }

  return {
    props: {
      // the response data
      profileInfo,
      profileList
    }
  }
}

export default Profile

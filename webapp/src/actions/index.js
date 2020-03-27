// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License for license information.

import {PostTypes} from 'mattermost-redux/action_types';
import {getConfig} from 'mattermost-redux/selectors/entities/general';

import Client from '../client';

export function startMeeting(channelId, force = false) {
    return async (dispatch, getState) => {
        try {
            const startFunction = force ? Client.forceStartMeeting : Client.startMeeting;
            const meetingURL = await startFunction(channelId, getServerRoute(getState()), true);
            if (meetingURL) {
                window.open(meetingURL);
            }
        } catch (error) {
            let m = 'We could not verify your Mattermost account in Zoom. Please ensure that your Mattermost email address matches your Zoom email address.';
            if (error.message && error.message[0] === '{') {
                const e = JSON.parse(error.message);

                // Error is from Zoom API
                if (e && e.message) {
                    m += '\nZoom error: ' + e.message;
                }
            }

            const post = {
                id: 'zoomPlugin' + Date.now(),
                create_at: Date.now(),
                update_at: 0,
                edit_at: 0,
                delete_at: 0,
                is_pinned: false,
                user_id: getState().entities.users.currentUserId,
                channel_id: channelId,
                root_id: '',
                parent_id: '',
                original_id: '',
                message: m,
                type: 'system_ephemeral',
                props: {},
                hashtags: '',
                pending_post_id: '',
            };

            dispatch({
                type: PostTypes.RECEIVED_NEW_POST,
                data: post,
                channelId,
            });

            return {error};
        }

        return {data: true};
    };
}

export const getServerRoute = (state) => {
    const config = getConfig(state);

    let basePath = '';
    if (config && config.SiteURL) {
        basePath = new URL(config.SiteURL).pathname;

        if (basePath && basePath[basePath.length - 1] === '/') {
            basePath = basePath.substr(0, basePath.length - 1);
        }
    }

    return basePath;
};
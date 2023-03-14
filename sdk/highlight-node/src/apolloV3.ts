import type {
	ApolloServerPlugin,
	BaseContext,
	GraphQLRequestContextDidEncounterErrors,
	GraphQLRequestListener,
} from 'apollo-server-plugin-base'
import { H, HIGHLIGHT_REQUEST_HEADER } from './sdk'
import { NodeOptions } from './types'

export const ApolloServerV3HighlightPlugin = function <T extends BaseContext>(
	options: NodeOptions,
): ApolloServerPlugin<T> {
	return {
		async requestDidStart(req): Promise<GraphQLRequestListener<T> | void> {
			let secureSessionId: string | undefined
			let requestId: string | undefined
			if (req.request.http?.headers?.get(HIGHLIGHT_REQUEST_HEADER)) {
				;[secureSessionId, requestId] =
					`${req.request.http.headers?.get(
						HIGHLIGHT_REQUEST_HEADER,
					)}`.split('/')
			}
			H._debug('processError', 'extracted from headers', {
				secureSessionId,
				requestId,
			})

			if (!H.isInitialized()) {
				H.init(options)
				H._debug('initialized H in apollo server')
			}
			return {
				async didEncounterErrors(
					requestContext: GraphQLRequestContextDidEncounterErrors<T>,
				): Promise<void> {
					H.consumeEvent(secureSessionId)
					for (const error of requestContext.errors) {
						H.consumeError(error, secureSessionId, requestId)
						H._debug('consumed apollo request error', error)
					}
				},
			}
		},
	}
}

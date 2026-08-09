/**
 * Generated from the backend contract. Do not edit.
 *
 * Source: backend/src/openapi/schemas.ts -> backend/openapi.json -> this file.
 * Regenerate: in the backend, `npm run api:contract && npm run api:types`.
 */

export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Liveness only — does not check the database or Redis */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Service is up */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Health"];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Public counters for the landing page */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Platform counters */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["PlatformStats"];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["RegisterRequest"];
                };
            };
            responses: {
                /** @description Account created; verification code sent */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Registration"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Email or CNIC already registered */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/verify-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["VerifyEmailRequest"];
                };
            };
            responses: {
                /** @description Email verified */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Message"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/resend-verification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Neutral response — does not reveal whether the address exists */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ResendVerificationRequest"];
                };
            };
            responses: {
                /** @description Code resent if applicable */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["OtpIssued"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["LoginRequest"];
                };
            };
            responses: {
                /** @description Signed in */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Session"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Incorrect email or password */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Rotates the refresh token */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["RefreshRequest"];
                };
            };
            responses: {
                /** @description New token pair */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["RefreshedTokens"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["RefreshRequest"];
                };
            };
            responses: {
                /** @description Signed out */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Message"];
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/forgot-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Neutral response — does not reveal whether the address exists */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ForgotPasswordRequest"];
                };
            };
            responses: {
                /** @description Reset code sent if applicable */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["OtpIssued"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/verify-reset-otp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["VerifyResetOtpRequest"];
                };
            };
            responses: {
                /** @description Code accepted */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Message"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ResetPasswordRequest"];
                };
            };
            responses: {
                /** @description Password reset */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Message"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/change-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ChangePasswordRequest"];
                };
            };
            responses: {
                /** @description Password changed */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Message"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The signed-in user */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: {
                                user: components["schemas"]["User"];
                            };
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Email preferences */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["NotificationPrefs"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["NotificationPreferences"];
                };
            };
            responses: {
                /** @description Updated preferences */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["NotificationPrefs"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/auctions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Public. Reserve amounts are never included — only reserveMet. */
        get: {
            parameters: {
                query?: {
                    status?: components["schemas"]["AuctionStatus"];
                    category?: string;
                    search?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Matching auctions */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Auction"][];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auctions/mine/bids": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The signed-in buyer's bids, each with its auction */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Your bids */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["BidWithAuction"][];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auctions/{auctionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** currentBid and bidCount come from Redis when a live value exists */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    auctionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The auction */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Auction"];
                        };
                    };
                };
                /** @description Not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auctions/{auctionId}/bids": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    auctionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Bid history, newest first */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Bid"][];
                        };
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    auctionId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["PlaceBidRequest"];
                };
            };
            responses: {
                /** @description Bid accepted */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Bid"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authenticated but the wrong role for this route */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Auction closed, or outbid between read and write */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["SubmitListingRequest"];
                };
            };
            responses: {
                /** @description Listing submitted for review */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Listing"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authenticated but the wrong role for this route */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/upload-signature": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Signed Cloudinary upload params; forces JPEG so HEIC uploads stay viewable */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Upload params */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["UploadSignature"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/mine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Your listings */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Listing"][];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/pending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Listings awaiting review */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Listing"][];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authenticated but the wrong role for this route */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/{listingId}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Creates the auction and schedules its close */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    listingId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Approved */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Approval"];
                        };
                    };
                };
                /** @description Only pending listings can be approved */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authenticated but the wrong role for this route */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/approve-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Per-listing outcome */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["BulkApproval"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authenticated but the wrong role for this route */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/{listingId}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** PENDING listings only — there is no takedown route for approved ones */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    listingId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["RejectListingRequest"];
                };
            };
            responses: {
                /** @description Rejected */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Rejection"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authenticated but the wrong role for this route */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/watchlist": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Watched auctions */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["WatchlistEntry"][];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/watchlist/{auctionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    auctionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Added */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["WatchToggle"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    auctionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Removed */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["WatchToggle"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/my-wins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Auctions you won */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["WonTransaction"][];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/seller-stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** COMPLETED transactions only */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Revenue and items sold */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["SellerStats"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/create-intent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** PKR is zero-decimal, so amounts are not multiplied by 100 */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        transactionId: string;
                    };
                };
            };
            responses: {
                /** @description Stripe client secret */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["PaymentIntent"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/webhook": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Stripe webhook. Needs the raw body, so it is mounted before express.json. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Acknowledged */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["WebhookAck"];
                        };
                    };
                };
                /** @description Bad signature */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Unread first, newest first, capped at 50 */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Your notifications */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Notification"][];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/{notificationId}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    notificationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Marked read */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["NotificationRead"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description All marked read */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Message"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["CreateReviewRequest"];
                };
            };
            responses: {
                /** @description Review created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Review"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description This transaction has already been reviewed */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reviews/seller/{sellerId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sellerId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Seller rating and reviews */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["SellerReviews"];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settings/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Unauthenticated — the maintenance gate and listing limits the UI needs */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Public settings */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["PublicSettings"];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description All settings */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["PlatformSettings"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authenticated but the wrong role for this route */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UpdateSettingsRequest"];
                };
            };
            responses: {
                /** @description Updated settings */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["PlatformSettings"];
                        };
                    };
                };
                /** @description Validation failed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationError"];
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authenticated but the wrong role for this route */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/analytics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Platform analytics */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            success: true;
                            data: components["schemas"]["Analytics"];
                        };
                    };
                };
                /** @description Missing, invalid or expired access token */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authenticated but the wrong role for this route */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        RegisterRequest: {
            name: string;
            email: string;
            cnic: string;
            password: string;
            /** @enum {string} */
            role: "BUYER" | "SELLER";
        };
        VerifyEmailRequest: {
            email: string;
            otp: string;
        };
        ResendVerificationRequest: {
            email: string;
        };
        LoginRequest: {
            email: string;
            password: string;
        };
        RefreshRequest: {
            refreshToken: string;
        };
        ForgotPasswordRequest: {
            email: string;
        };
        VerifyResetOtpRequest: {
            email: string;
            otp: string;
        };
        ResetPasswordRequest: {
            email: string;
            otp: string;
            password: string;
        };
        ChangePasswordRequest: {
            currentPassword: string;
            newPassword: string;
        };
        NotificationPreferences: {
            notifyOutbid?: boolean;
            notifyWins?: boolean;
            notifyNews?: boolean;
        };
        /** @enum {string} */
        AuctionStatus: "SCHEDULED" | "ACTIVE" | "CLOSED";
        PlaceBidRequest: {
            amount: number;
        };
        SubmitListingRequest: {
            title: string;
            category: string;
            /** @enum {string} */
            condition: "NEW" | "LIKE_NEW" | "USED";
            description: string;
            startPrice: number;
            reservePrice?: number;
            minIncrement: number;
            durationDays: number;
            /** Format: uri */
            imageUrl?: string;
            emoji?: string;
            attributes?: {
                [key: string]: unknown;
            };
        };
        RejectListingRequest: {
            reason: string;
        };
        CreateReviewRequest: {
            transactionId: string;
            stars: number;
            comment?: string;
        };
        UpdateSettingsRequest: {
            emailNotifsEnabled?: boolean;
            maintenanceMode?: boolean;
            maxBidIncrement?: number;
            minListingPrice?: number;
            reviewTimeoutHours?: number;
            supportEmail?: string;
        };
        Health: {
            /** @constant */
            status: "ok";
            service: string;
        };
        PlatformStats: {
            userCount: number;
            activeAuctionCount: number;
            transactionTotal: number;
            listingCount: number;
            completedSalesCount: number;
        };
        Registration: {
            user: components["schemas"]["User"];
            verificationCode?: string;
            /** Format: date-time */
            codeExpiresAt: string;
        };
        User: {
            userId: string;
            name: string;
            /** Format: email */
            email: string;
            role: components["schemas"]["UserRole"];
            isEmailVerified: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        /** @enum {string} */
        UserRole: "BUYER" | "SELLER" | "ADMIN";
        ValidationError: {
            /** @constant */
            success: false;
            /** @constant */
            error: "Validation error";
            details: {
                [key: string]: string[];
            };
        };
        ErrorResponse: {
            /** @constant */
            success: false;
            error: string;
            code?: string;
        };
        Message: {
            message: string;
        };
        OtpIssued: {
            message: string;
            resetCode?: string;
            verificationCode?: string;
            /** Format: date-time */
            codeExpiresAt: string;
        };
        Session: {
            accessToken: string;
            refreshToken: string;
            user: components["schemas"]["User"];
        };
        RefreshedTokens: {
            accessToken: string;
            refreshToken: string;
        };
        NotificationPrefs: {
            notifyOutbid: boolean;
            notifyWins: boolean;
            notifyNews: boolean;
        };
        Auction: {
            auctionId: string;
            listingId: string;
            title: string;
            category: string;
            condition: components["schemas"]["ItemCondition"];
            description: string;
            emoji: string;
            sellerId: string;
            sellerName: string;
            sellerRating: number | null;
            sellerSales: number | null;
            startPrice: number;
            currentBid: number;
            minIncrement: number;
            reserveMet: boolean | null;
            bidCount: number;
            /** Format: date-time */
            startTime: string;
            /** Format: date-time */
            endTime: string;
            status: components["schemas"]["AuctionStatus"];
            imageUrl: string;
            images: string[];
            attributes?: components["schemas"]["CategoryAttributes"];
        };
        /** @enum {string} */
        ItemCondition: "NEW" | "LIKE_NEW" | "USED";
        /** @description Category-specific fields; keys vary by category. */
        CategoryAttributes: {
            [key: string]: string | number;
        };
        BidWithAuction: {
            bidId: string;
            auctionId: string;
            buyerId: string;
            buyerName: string;
            amount: number;
            /** Format: date-time */
            timestamp: string;
            auction: components["schemas"]["Auction"];
        };
        Bid: {
            bidId: string;
            auctionId: string;
            buyerId: string;
            buyerName: string;
            amount: number;
            /** Format: date-time */
            timestamp: string;
        };
        Listing: {
            listingId: string;
            listingCode: string;
            sellerId: string;
            sellerName: string;
            title: string;
            category: string;
            condition: components["schemas"]["ItemCondition"];
            description: string;
            startPrice: number;
            reservePrice?: number;
            minIncrement: number;
            durationDays: number;
            status: components["schemas"]["ListingStatus"];
            rejectionReason?: string;
            /** Format: date-time */
            submittedAt: string;
            emoji: string;
            imageUrl?: string;
            /** Format: email */
            sellerEmail: string;
            attributes?: components["schemas"]["CategoryAttributes"];
        };
        /** @enum {string} */
        ListingStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
        UploadSignature: {
            signature: string;
            timestamp: number;
            apiKey: string;
            cloudName: string;
            folder: string;
            format: string;
        };
        Approval: {
            listingId: string;
            /** @constant */
            status: "APPROVED";
            auctionId?: string;
            warning?: string;
        };
        BulkApproval: {
            approved: number;
            failed: number;
            failures: {
                listingId: string;
                error: string;
            }[];
        };
        Rejection: {
            listingId: string;
            status: components["schemas"]["ListingStatus"];
            rejectionReason: string | null;
        };
        WatchlistEntry: {
            auctionId: string;
            title: string;
            currentBid: number;
            status: components["schemas"]["AuctionStatus"];
            /** Format: date-time */
            endTime: string;
        };
        WatchToggle: {
            auctionId: string;
            watched: boolean;
        };
        WonTransaction: {
            transactionId: string;
            auctionId: string;
            auctionTitle: string;
            auctionEmoji: string;
            auctionImageUrl: string;
            sellerName: string;
            finalAmount: number;
            status: components["schemas"]["TransactionStatus"];
            /** Format: date-time */
            createdAt: string;
            reviewed: boolean;
        };
        /** @enum {string} */
        TransactionStatus: "PENDING" | "COMPLETED" | "FAILED";
        SellerStats: {
            totalRevenue: number;
            itemsSold: number;
        };
        PaymentIntent: {
            clientSecret: string | null;
        };
        WebhookAck: {
            /** @constant */
            received: true;
        };
        Notification: {
            id: string;
            type: components["schemas"]["NotificationType"];
            title: string;
            message: string;
            isRead: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        /** @enum {string} */
        NotificationType: "BID_OUTBID" | "AUCTION_WON" | "RESERVE_NOT_MET" | "LISTING_APPROVED" | "LISTING_REJECTED" | "NEW_REVIEW";
        NotificationRead: {
            id: string;
            /** @constant */
            isRead: true;
        };
        Review: {
            reviewId: string;
            stars: number;
            comment: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        SellerReviews: {
            sellerId: string;
            average: number | null;
            count: number;
            reviews: {
                reviewId: string;
                stars: number;
                comment: string | null;
                /** Format: date-time */
                createdAt: string;
                buyerName: string;
            }[];
        };
        PublicSettings: {
            maintenanceMode: boolean;
            /** Format: email */
            supportEmail: string;
            minListingPrice: number;
            maxBidIncrement: number;
        };
        PlatformSettings: {
            emailNotifsEnabled: boolean;
            maintenanceMode: boolean;
            maxBidIncrement: number;
            minListingPrice: number;
            reviewTimeoutHours: number;
            supportEmail: string;
        };
        Analytics: {
            totalRevenue: number;
            totalBids: number;
            avgBidValue: number;
            sellerConversionRate: number;
            monthlyRevenue: {
                month: string;
                value: number;
                bids: number;
            }[];
            categoryBreakdown: {
                name: string;
                count: number;
                pct: number;
            }[];
            topSellers: {
                sellerId: string;
                sellerName: string;
                sales: number;
                revenue: number;
            }[];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;

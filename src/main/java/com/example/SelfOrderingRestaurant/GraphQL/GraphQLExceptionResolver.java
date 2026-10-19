package com.example.SelfOrderingRestaurant.GraphQL;

import com.example.SelfOrderingRestaurant.Exception.AuthorizationException;
import com.example.SelfOrderingRestaurant.Exception.BadRequestException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.TableNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Component;

/**
 * Turns business errors thrown by resolvers into readable GraphQL errors instead of the opaque
 * "INTERNAL_ERROR for <id>", so a guest sees e.g. "No staff is currently on shift".
 * Unknown errors keep the default internal-error handling (no internals leak).
 */
@Component
public class GraphQLExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        Throwable root = businessCause(ex);
        if (root == null) {
            return null;
        }
        return GraphqlErrorBuilder.newError(env)
                .errorType(errorType(root))
                .message(root.getMessage())
                .build();
    }

    static Throwable businessCause(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            if (t instanceof ValidationException || t instanceof BadRequestException
                    || t instanceof IllegalArgumentException || t instanceof IllegalStateException
                    || t instanceof ResourceNotFoundException || t instanceof TableNotFoundException
                    || t instanceof AccessDeniedException || t instanceof AuthorizationException
                    || t instanceof AuthenticationCredentialsNotFoundException) {
                return t;
            }
            if (t.getCause() == t) {
                break;
            }
        }
        return null;
    }

    private static ErrorType errorType(Throwable t) {
        if (t instanceof ResourceNotFoundException || t instanceof TableNotFoundException) {
            return ErrorType.NOT_FOUND;
        }
        if (t instanceof AuthenticationCredentialsNotFoundException) {
            return ErrorType.UNAUTHORIZED;
        }
        if (t instanceof AccessDeniedException || t instanceof AuthorizationException) {
            return ErrorType.FORBIDDEN;
        }
        return ErrorType.BAD_REQUEST;
    }
}

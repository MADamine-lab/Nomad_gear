from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    Custom token obtain view that sets tokens in cookies
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            # Set cookies
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=False,  # Allow JavaScript access
                secure=False,    # Set to True in production with HTTPS
                samesite='Lax',
                path='/'
            )

            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=False,  # Allow JavaScript access
                secure=False,    # Set to True in production with HTTPS
                samesite='Lax',
                path='/'
            )

        return response


class CookieTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view that updates cookies
    """
    def post(self, request, *args, **kwargs):
        # Get refresh token from cookie if not in request data
        if not request.data.get('refresh'):
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                request.data['refresh'] = refresh_token

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')

            # Update access token cookie
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=False,  # Allow JavaScript access
                secure=False,    # Set to True in production with HTTPS
                samesite='Lax',
                path='/'
            )

        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout view that clears authentication cookies
    """
    response = Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)

    # Clear cookies
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')

    return response
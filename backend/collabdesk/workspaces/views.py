from rest_framework.views import APIView
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Workspace, WorkspaceMember
from .serializer import WorkspaceSerializer, WorkspaceCreateSerializer


class WorkspaceInformationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        workspace_id = request.query_params.get("workspace_id")

        # Validate input
        if not workspace_id:
            return Response(
                {"error": "workspace_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = get_object_or_404(Workspace, workspace_id=workspace_id)

        # Use authenticated user instead of requiring user_id parameter
        user = request.user

        # Check if user is a member
        is_member = WorkspaceMember.objects.filter(
            workspace=workspace, user=user, is_active=True
        ).exists()

        serializer = WorkspaceSerializer(workspace)
        data = serializer.data
        data["is_member"] = is_member
        data["is_public"] = False  # you can extend model later

        # If user not member → strip members & owner info
        if not is_member:
            data.pop("members", None)
            data.pop("owner", None)

        return Response(data, status=status.HTTP_200_OK)


class WorkspaceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only return workspaces the user is a member of
        user = request.user
        workspace_ids = WorkspaceMember.objects.filter(
            user=user, is_active=True
        ).values_list("workspace_id", flat=True)

        workspaces = Workspace.objects.filter(workspace_id__in=workspace_ids).values(
            "workspace_id", "name", "created_by_id"
        )

        return Response(list(workspaces))


class WorkspaceCreateView(generics.CreateAPIView):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

class WorkspaceDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, workspace_id):
        user = request.user
        try:
            workspace = Workspace.objects.get(workspace_id=workspace_id)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        # Ensure only creator can delete
        if workspace.created_by != user:
            return Response(
                {"error": "You are not authorized to delete this workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Delete all related WorkspaceMember records
        # WorkspaceMember.objects.filter(workspace=workspace).delete()

        # Delete the workspace itself
        workspace.delete()

        return Response({"message": "Workspace deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


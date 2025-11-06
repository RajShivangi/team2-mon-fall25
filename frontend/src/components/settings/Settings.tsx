import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchCurrentUser, fetchWorkspaceList, deleteWorkspace } from "../../lib/api";
import type {WorkspaceListItem} from "../../lib/api";
import { Trash2 } from "lucide-react";

export function Settings({
  workspaceId,
  onLeaveWorkspace,
}: {
  workspaceId: string;
  onLeaveWorkspace: (id: string) => void;
}) {
  const { logout, isAuthenticated } = useAuth0();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);;
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);

  // Fetch current user data from backend
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUserData = async () => {
      try {
        setLoading(true);
        const userData = await fetchCurrentUser();
        setName(userData.full_name || "");
        setEmail(userData.email || "");
        setProfilePic(userData.profile_picture);
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated]);


    useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const user = await fetchCurrentUser();
        setCurrentUserId(user.id);

        const ws = await fetchWorkspaceList();
        setWorkspaces(ws);
      } catch (err) {
        console.error("Error fetching workspaces:", err);
      }
    };

    loadWorkspaces();
  }, []);


  const handleLeaveWorkspace = () => {
    if (
      window.confirm(
        "Are you sure you want to leave this workspace? You will lose access to its calendar and resources."
      )
    ) {
      onLeaveWorkspace(workspaceId);
    }
  };

  const handleDelete = async (workspaceId: string) => {
  try {
    await deleteWorkspace(workspaceId);
    setWorkspaces((prev) => prev.filter((w) => w.workspace_id !== workspaceId));
  } catch (err) {
    console.error("Delete failed:", err);
  }
};

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="text-center py-8 text-zinc-500">Loading user information...</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>

      {/* Profile Picture */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg font-medium text-white overflow-hidden">
          {profilePic ? (
            <img
              src={profilePic}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            name ? name[0].toUpperCase() : "?"
          )}
        </div>
        <div>
          <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">{name || "User"}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
        </div>
      </div>

      {/* Notifications */}
      <div className="mb-8 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
        <label className="text-sm font-medium">Enable Notifications</label>
        <button
          onClick={() => setNotifications(!notifications)}
          className={`w-11 h-6 rounded-full transition-colors ${
            notifications
              ? "bg-zinc-900 dark:bg-zinc-100"
              : "bg-zinc-300 dark:bg-zinc-700"
          } relative`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white dark:bg-black transform transition-transform ${
              notifications ? "translate-x-5" : "translate-x-0"
            }`}
          ></span>
        </button>
      </div>
      


{/* Fetch Workspaces with Delete Button */}
<div className="mt-6 border-t border-gray-300 dark:border-neutral-700 pt-4">
  <h3 className="text-gray-900 dark:text-white text-lg mb-3">Workspaces</h3>

  {workspaces.length === 0 ? (
    <p className="text-gray-600 dark:text-gray-400 text-sm">
      No workspaces joined yet.
    </p>
  ) : (
    <ul className="space-y-2">
      {workspaces.map((workspace) => (
        <li
          key={workspace.workspace_id}
          className="flex justify-between items-center 
                     bg-gray-100 dark:bg-neutral-900 
                     text-gray-900 dark:text-gray-100 
                     p-3 rounded-xl shadow-sm transition-colors"
        >
          <span>{workspace.name}</span>

          <button
            disabled={workspace.created_by_id !== currentUserId}
            onClick={() => handleDelete(workspace.workspace_id)}
            className={`p-2 rounded-full transition-colors ${
              workspace.created_by_id === currentUserId
                ? "text-red-600 hover:bg-red-100 hover:dark:bg-red-700 dark:text-red-500"
                : "opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-500"
            }`}
          >
            <Trash2 size={18} />
          </button>
        </li>
      ))}
    </ul>
  )}
</div>



      {/* Leave Workspace */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <button
          onClick={handleLeaveWorkspace}
          className="w-full rounded-md bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-medium transition"
        >
          Leave Workspace
        </button>

        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 text-sm font-medium py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
export function normalizeVisibility(value) {
  if (!value) {
    return "shared";
  }
  const normalized = String(value).toLowerCase();
  if (normalized === "private") {
    return "private";
  }
  return "shared";
}

export function getUserGroupId(user) {
  return user?.groupId || user?.coupleId || null;
}

export function getEventVisibility(event) {
  return normalizeVisibility(event.visibility || event.categoryType || event.category);
}

export function getVisibleEventsForUser(events, currentUser, filter = "all") {
  if (!currentUser) {
    return [];
  }

  const currentUserId = currentUser.userId || currentUser.id;
  const currentGroupId = getUserGroupId(currentUser);
  const currentFilter = filter || "all";

  return events.filter((event) => {
    const visibility = getEventVisibility(event);
    const sameGroup = !event.groupId || !currentGroupId ? true : event.groupId === currentGroupId;
    const isOwner = event.ownerId === currentUserId;

    if (currentFilter === "shared") {
      return visibility === "shared" && sameGroup;
    }

    if (currentFilter === "private") {
      return visibility === "private" && isOwner;
    }

    if (visibility === "shared") {
      return sameGroup;
    }

    return isOwner;
  });
}

/**
 * This code can be used both from client (browser) and server (node).
 *
 * IMPORTANT:
 * (1) I don't have a way to split it in multiple files yet.
 * (2) No client or server specific code constructs may be used here.
 *     E.g.: if you need to do e.g. logging when used at server, winston needs to be passed to the functions here.
 *
 * All the code in this module is intentionally enclosed in a closure.
 * Idea taken from:
 *  https://www.geeksforgeeks.org/how-to-share-code-between-node-js-and-the-browser/
 * Also interesting info at:
 *  https://stackoverflow.com/questions/3225251/how-can-i-share-code-between-node-js-and-the-browser
 */
const { format, isSameYear } = require("date-fns");
(function(exports) {
	const DEFAULT_ALTERNATIVE_VALID_START = format(new Date(2000, 1, 1, 0, 0), "yyyy-MM-dd HH:mm");
	const DEFAULT_ALTERNATIVE_VALID_END = format(new Date(2099, 1, 1, 0, 0), "yyyy-MM-dd HH:mm");
	const DEFAULT_MESSAGE_VALID_START = format(new Date(2099, 1, 1, 0, 0), "yyyy-MM-dd HH:mm");
	const DEFAULT_MESSAGE_VALID_END = format(new Date(2199, 1, 1, 0, 0), "yyyy-MM-dd HH:mm");

	const USE_AUTOMATED_BEHAVIOUR = "#---#";
	const PAUSE_TARGET_NONE = "none";
	const PAUSE_TARGET_DEFAULT = "default";
	const PAUSE_TARGET_INVALID_VALUE = "invalidValue";
	const GRAPHQL_OBJECT_TYPE_NAMES = Object.freeze({
		PARENT_SCREEN_TYPE: "ParentScreenType",
		SCREEN_TYPE: "ScreenType",
		HEADER_TYPE: "HeaderType",
		ROW_TYPE: "RowType",
		PARENT_CATALOG_TYPE: "ParentCatalogType",
		CATALOG_TYPE: "CatalogType",
		VOD_ITEM_TYPE: "VodItemType",
		EPG_ITEM_TYPE: "EpgItemType",
		ITEM_TYPE: "ItemType",
		QUERY_TYPE: "QueryType",
		BANNER_TYPE: "BannerType",
		CHANNEL_TYPE: "ChannelType",
		CHANNEL_LIST_TYPE: "ChannelListType",
		UPSELL_PRODUCT_TYPE: "UpsellProductType",
		SUBSCRIPTION_PRODUCT_TYPE: "SubscriptionProductType",
		QUICK_GUIDE_TYPE: "QuickGuideType",
		PUBLISH_INFO_TYPE: "PublishInfoType",
		HOUSEHOLD_TYPE: "HouseholdType",
		DEVICE_TYPE: "DeviceType",
		BADGE_TYPE: "BadgeType",
		MESSAGE_TYPE: "MessageType",
		MESSAGE_ACTION_TYPE: "MessageActionType",
		MESSAGE_ICON_TYPE: "MessageIconType",
		SEGMENT_TYPE: "SegmentType",
		ATTACHMENT_TYPE: "AttachmentType",
		CONTENT_PROVIDER_TYPE: "ContentProviderType",
		// Dummy types:
		REPLAY_LIST_TYPE: "ReplayListType",
		PAUSE_CONTENT_TYPE: "PauseContentType",
		BADGE_RULES_TYPE: "BadgeRulesType",
		SEGMENT_USER_TYPE: "SegmentType",
		VOD_LIBRARY_TYPE: "VodLibraryType"
	});

	const VOD_ITEM_TYPES_CONSTANTS = Object.freeze({
		TVEVENT: 1,
		EPISODE: 2,
		SERIES: 3,
		SEASON: 4,
		MOVIE: 5,
		TRAILER: 6,
		BARKER: 7,
		RECAP: 8,
		FOLDER: 9,
		BOXSET: 10,
		OPENSEASON: 11
	});

	const UPSELL_TYPES_CONSTANTS = Object.freeze({
		MAIN_PACKAGE: "(Main) Package",
		CHANNEL_PACKAGE_ADDON: "Channel Package Add-on",
		ON_DEMAND_PACKAGE_ADDON: "On Demand Package Add-on",
		FEATURE_ADDON: "Feature Add-on"
	});
	const DISPLAY_TYPES_CONSTANTS = Object.freeze({
		MAIN_PACKAGE: "mixed_bundle",
		CHANNEL_PACKAGE_ADDON: "channel_bundle",
		ON_DEMAND_PACKAGE_ADDON: "on_demand_bundle",
		FEATURE_ADDON: "feature_bundle"
	});

	// https://zappware.atlassian.net/browse/MC-2234 use this link as reference why are those deep links
	const DEEP_LINKS = Object.freeze({
		HOME: "Home",
		ON_DEMAND: "OnDemand/id=",
		MY_LIBRARY: "MyLibrary",
		SETTINGS: "Settings",
		SETTINGS_LANGUAGES: "Settings/languages",
		SETTINGS_PROFILES: "Settings/profiles",
		SETTINGS_STREAMING: "Settings/streaming",
		SETTINGS_ACCOUNT: "Settings/account",
		SETTINGS_PRIVACY: "Settings/privacy",
		SETTINGS_ABOUT: "Settings/about",
		SETTINGS_MISCELLANEOUS: "Settings/miscellaneous",
		DETAILED_TV_INFO: "DetailedTVInfo/?id=",
		DETAILED_RECORDING_INFO: "DetailedRecordingInfo/?id=",
		DETAILED_ON_DEMAND_VIDEO_INFO: "DetailedOnDemandVideoInfo/?id=",
		DETAILED_ON_DEMAND_SERIES_INFO: "DetailedOnDemandSeriesInfo/?id=",
		DETAILED_ON_DEMAND_BOXSET_INFO: "DetailedOnDemandBoxsetInfo/?id=",
		DETAILED_CHANNEL_INFO: "DetailedChannelInfo/?id=",
		DETAILED_ON_DEMAND_PACKAGE_INFO: "DetailedOnDemandPackageInfo/?id=",
		DETAILED_CHANNEL_PACKAGE_INFO: "DetailedChannelPackageInfo/?id=",
		DETAILED_MAIN_PACKAGE_INFO: "DetailedMainPackageInfo/?id=",
		DETAILED_FEATURE_INFO: "DetailedFeatureInfo/?id=",
		SEARCH: "Search/?orderContentType="
	});

	const PROMISE_STATUS = Object.freeze({
		FULFILLED: "fulfilled",
		REJECTED: "rejected"
	});

	const NOTIFICATION_TARGET_TYPES = Object.freeze({
		DOMAIN: 1,
		HOUSEHOLD: 2,
		USER: 3,
		USER_SEGMENT: 7,
		DEVICE: 4
	});

	const DEFAULT_PAGING_VALUES = Object.freeze({
		DEFAULT_PAGE_SIZE: 1,
		DEFAULT_PAGE: 0,
		DEFAULT_USERS_SEGMENT_ADD: 512
	});

	const ACTION_TYPES = Object.freeze({
		CREATE: "CREATE",
		UPDATE: "UPDATE",
		DELETE: "DELETE",
		COPY: "COPY",
		PUBLISH: "PUBLISH",
		ADD: "ADD",
		REMOVE: "REMOVE",
		REORDER: "REORDER",
		TARGET: "TARGET"
	});

	const AUTOMATED_CATALOG_TYPES = Object.freeze({
		NCANTO: "Ncanto",
		BACK_OFFICE: "Back-office"
	});

	const SCREEN_TYPES = Object.freeze({
		HOME: "Home",
		SEARCH_FROM_EVENTS: "Search from Event",
		SEARCH_FROM_EVENTS_INITIAL: "Search from Events (Initial)",
		SEARCH_FROM_RECORDINGS: "Search from Recordings",
		SEARCH_FROM_RECORDINGS_INITIAL: "Search from Recordings (Initial)",
		SEARCH_FROM_ON_DEMAND: "Search from On Demand",
		SEARCH_FROM_ON_DEMAND_INITIAL: "Search from On Demand (Initial)",
		ON_DEMAND: "On Demand",
		MY_LIBRARY: "My Library",
		DETAILED_TV_INFO: "Detailed TV Info",
		DETAILED_RECORDING_INFO: "Detailed Recording Info",
		DETAILED_ON_DEMAND_VIDEO_INFO: "Detailed On Demand Video Info",
		DETAILED_CHANNEL_INFO: "Detailed Channel Info",
		DETAILED_ON_DEMAND_PACKAGE_INFO: "Detailed On Demand Package Info",
		DETAILED_CHANNEL_PACKAGE_INFO: "Detailed Channel Package Info",
		DETAILED_MAIN_PACKAGE_INFO: "Detailed Main Package Info",
		DETAILED_FEATURE_INFO: "Detailed Feature Info"
		/* DETAILED_PROMOTION_INFO: "Detailed Promotion Info", // Disabled for now. Not supported anywhere by SDS MW or clients. */
	});

	const PARENT_SCREEN_TYPES_BASE_FORM = Object.freeze({
		HOME: "Home",
		SEARCH_FROM_EVENTS: "Search from Event",
		SEARCH_FROM_EVENTS_INITIAL: "Search from Events (Initial)",
		SEARCH_FROM_RECORDINGS: "Search from Recordings",
		SEARCH_FROM_RECORDINGS_INITIAL: "Search from Recordings (Initial)",
		SEARCH_FROM_ON_DEMAND: "Search from On Demand",
		SEARCH_FROM_ON_DEMAND_INITIAL: "Search from On Demand (Initial)",
		MY_LIBRARY: "My Library",
		DETAILED_TV_INFO: "Detailed TV Info",
		DETAILED_RECORDING_INFO: "Detailed Recording Info",
		DETAILED_ON_DEMAND_VIDEO_INFO: "Detailed On Demand Video Info",
		DETAILED_CHANNEL_INFO: "Detailed Channel Info"
	});

	const PARENT_SCREEN_TYPES_WITH_UPSELL_PRODUCT_FORM = Object.freeze({
		DETAILED_ON_DEMAND_PACKAGE_INFO: "Detailed On Demand Package Info",
		DETAILED_CHANNEL_PACKAGE_INFO: "Detailed Channel Package Info",
		DETAILED_MAIN_PACKAGE_INFO: "Detailed Main Package Info",
		DETAILED_FEATURE_INFO: "Detailed Feature Info"
	});

	const CHANNEL_NUMBER_BY_OPTIONS = Object.freeze({
		Default: 1,
		FromZero: 2,
		FromOne: 3,
		From100: 4
	});

	const CHANNEL_RANGES = Object.freeze({
		BOTTOM: 0,
		TOP: 9999
	});

	const CHANNEL_FORMATS = Object.freeze([
		{
			id: 1,
			name: "SD",
			description: "SD Picture Format",
			resolution_x: 768,
			resolution_y: 564,
			time_stamp: "2018-Apr-04 15:04:28.531589"
	  },
	  {
			id: 2,
			name: "HD",
			description: "HD Picture Format",
			resolution_x: 1920,
			resolution_y: 1080,
			time_stamp: "2018-Apr-04 15:04:28.557080"
	  },
	  {
			id: 3,
			name: "UHD",
			description: "UHD Picture Format",
			resolution_x: 3840,
			resolution_y: 2160,
			time_stamp: "2018-Apr-04 15:04:28.581629"
	  }
	]);

	const REALM_NAME = "Marketing Console"; // This has to be same as the realm name in Keycloak.
	function composeUserActivityMessage(userActivity, winston = undefined, translations, formatMessage) {
		try {
			const actionType = userActivity.actionType;
			const actionData = userActivity?.actionData;

			const userName = userActivity.userName;
			const itemTypeName = translateObjectTypeName(actionData.itemType, 1, translations, formatMessage, false, false);
			const itemSubtypeName = translateObjectSubtypeName(actionData, translations, formatMessage);
			const parentItemId = actionData.parentItemId;
			const parentItemName = actionData.parentItemName;
			const itemId = parentItemId ? `${parentItemId}/${actionData.itemId}` : actionData.itemId;
			const itemName = parentItemName ? `${parentItemName}/${actionData.itemName}` : actionData.itemName;
			const separator = "', '";

			let message;
			if (actionType == ACTION_TYPES.CREATE) {
				if (formatMessage) {
					message = formatMessage(translations.messageCreate, { userName, itemTypeName, itemSubtypeName, itemName, itemId });
				} else {
					message = `User '${userName}' created ${itemSubtypeName} ${itemTypeName} '${itemName}' (id='${itemId}').`;
				}
				// TODO: UAR: Add referencedItem for screens and somewhere else too?
			} else if (actionType == ACTION_TYPES.COPY) {
				const copiedItemId = actionData.parentItemId ? `${actionData.parentItemId}/${actionData.copiedItemId}` : actionData.copiedItemId;
				const copiedItemName = actionData.parentItemName ? `${actionData.parentItemName}/${actionData.copiedItemName}` : actionData.copiedItemName;

				if (formatMessage) {
					message = formatMessage(translations.messageCopy, { userName, itemTypeName, itemName, itemId, copiedItemId, copiedItemName });
				} else {
					message = `User '${userName}' copied ${itemTypeName} '${itemName}' (id='${itemId}') to '${copiedItemName}' (id='${copiedItemId}').`;
				}
			} else if (actionType == ACTION_TYPES.UPDATE) {
				const itemValues = JSON.stringify(actionData.itemValues);

				if (actionData.itemType == GRAPHQL_OBJECT_TYPE_NAMES.REPLAY_LIST_TYPE) {
					const itemCount = actionData.itemValues.channelIds ? actionData.itemValues.channelIds.length : 0;
					const plural = (itemCount > 1);
					const addedChannelsTypeName = translateObjectTypeName(GRAPHQL_OBJECT_TYPE_NAMES.CHANNEL_TYPE, itemCount, translations, formatMessage, false, false);
					const addedChannelIds = actionData?.itemValues?.channelIds.join(separator);
					const addedChannelNames = actionData?.itemValues?.channelNames.join(separator);

					if (formatMessage) {
						message = formatMessage(translations.messageUpdateReplayList, { userName, itemCount, addedChannelIds, addedChannelNames });
					} else {
						if (itemCount == 0) {
							message = `User '${userName}' removed all channels from the replay list.`;
						} else {
							message = `User '${userName}' updated the replay list to the (${plural ? "channels" : "channel"} ${addedChannelsTypeName} '${addedChannelNames}' (${plural ? "ids" : "id"}='${addedChannelIds}').`;
						}
					}
				} else {
					if (formatMessage) {
						message = formatMessage(translations.messageUpdate, { userName, itemTypeName, itemName, itemId, itemValues });
					} else {
						message = `User '${userName}' updated ${itemTypeName} '${itemName}' (id='${itemId}') to '${itemValues}'.`;
					}
				}
			} else if (actionType == ACTION_TYPES.DELETE) {
				const itemCount = actionData?.deletedItemIds ? actionData.deletedItemIds.length : 0;
				const plural = (itemCount > 1);
				const itemsTypeName = translateObjectTypeName(actionData.itemType, itemCount, translations, formatMessage, false, false);
				const parentTypeName = (actionData.itemType == GRAPHQL_OBJECT_TYPE_NAMES.SCREEN_TYPE)
					? translateObjectTypeName(GRAPHQL_OBJECT_TYPE_NAMES.PARENT_SCREEN_TYPE, 1, translations, formatMessage, false, false)
					: (actionData.itemType == GRAPHQL_OBJECT_TYPE_NAMES.CATALOG_TYPE)
						? translateObjectTypeName(GRAPHQL_OBJECT_TYPE_NAMES.PARENT_CATALOG_TYPE, 1, translations, formatMessage, false, false)
						: undefined; // TODO: UAR: I fixed this, but check if it works for removed screen and catalog alternatives from their parent.
				const deletedItemIds = actionData?.deletedItemIds.join(separator);
				const deletedItemNames = actionData?.deletedItemNames.join(separator);

				if (parentTypeName) {
					if (formatMessage) {
						message = formatMessage(translations.messageDeleteIn, { userName, itemCount, itemsTypeName, deletedItemNames, deletedItemIds, parentTypeName, parentItemId, parentItemName });
					} else {
						message = `User '${userName}' deleted ${itemCount} ${itemsTypeName} '${deletedItemNames}' (${plural ? "ids" : "id"}='${deletedItemIds}') in ${parentTypeName} '${parentItemName}' (id=${parentItemId}).`;
					}
				} else {
					if (formatMessage) {
						message = formatMessage(translations.messageDelete, { userName, itemCount, itemsTypeName, deletedItemNames, deletedItemIds });
					} else {
						message = `User '${userName}' deleted ${itemCount} ${itemsTypeName} '${deletedItemNames}' (${plural ? "ids" : "id"}='${deletedItemIds}').`;
					}
				}
			} else if (actionType == ACTION_TYPES.PUBLISH) {
				const itemsTypeName = translateObjectTypeName(actionData.itemType, 2 /* more than 1 to get the plural noun */, translations, formatMessage, false, false);
				const preview = actionData.preview;

				if (formatMessage) {
					message = formatMessage(translations.messagePublish, { userName, itemsTypeName, preview });
				} else {
					message = `User '${userName}' published the ${itemsTypeName}${preview ? " for preview" : ""}.`;
				}
			} else if (actionType == ACTION_TYPES.ADD) {
				const itemType = actionData.itemType;
				const itemsType = actionData.addedItemsType;
				const isSetAndNotAdd =
					((itemType == GRAPHQL_OBJECT_TYPE_NAMES.SCREEN_TYPE) && (itemsType == GRAPHQL_OBJECT_TYPE_NAMES.HEADER_TYPE)) ||
					((itemType == GRAPHQL_OBJECT_TYPE_NAMES.CATALOG_TYPE) && (itemsType == GRAPHQL_OBJECT_TYPE_NAMES.QUERY_TYPE)) ||
					((itemType == GRAPHQL_OBJECT_TYPE_NAMES.QUICK_GUIDE_TYPE) && (itemsType == GRAPHQL_OBJECT_TYPE_NAMES.VOD_ITEM_TYPE)) ||
					((itemType == GRAPHQL_OBJECT_TYPE_NAMES.BANNER_TYPE) && (itemsType == GRAPHQL_OBJECT_TYPE_NAMES.ITEM_TYPE));
				const itemCount = actionData.addedItemIds ? actionData.addedItemIds.length : 0;
				const plural = (itemCount > 1);
				const addedItemsTypeName = translateObjectTypeName(actionData.addedItemsType, itemCount, translations, formatMessage, false, false);
				const addedItemIds = actionData?.addedItemIds ? actionData.addedItemIds.join(separator) : [];
				const addedItemNames = actionData?.addedItemNames ? actionData?.addedItemNames.join(separator) : "";

				if (isSetAndNotAdd) {
					if (formatMessage) {
						message = formatMessage(translations.messageSet, { userName, itemTypeName, itemName, itemId, addedItemsTypeName, addedItemNames, addedItemIds });
					} else {
						message = `User '${userName}' set ${addedItemsTypeName} of ${itemTypeName} '${itemName}' (id='${itemId}') to '${addedItemNames}' (id='${addedItemIds}').`;
					}
					// TODO: UAR: For banner, convert target/target type to something user-friendly (e.g. 'screen', 'catalog', ...) and name (e.g. "Home", "Terminator", ...) of the target should be added too.
				} else {
					if (formatMessage) {
						message = formatMessage(translations.messageAdd, { userName, itemTypeName, itemName, itemId, itemCount, addedItemsTypeName, addedItemNames, addedItemIds });
					} else {
						message = `User '${userName}' added ${itemCount} ${addedItemsTypeName} '${addedItemNames}' (${plural ? "ids" : "id"}='${addedItemIds}') to ${itemTypeName} '${itemName}'.`;
					}
				}
			} else if (actionType == ACTION_TYPES.REMOVE) {
				const itemType = actionData.itemType;
				const itemsType = actionData.removedItemsType;
				const isUnsetAndNotRemove =
					((itemType == GRAPHQL_OBJECT_TYPE_NAMES.SCREEN_TYPE) && (itemsType == GRAPHQL_OBJECT_TYPE_NAMES.HEADER_TYPE)) ||
					((itemType == GRAPHQL_OBJECT_TYPE_NAMES.CATALOG_TYPE) && (itemsType == GRAPHQL_OBJECT_TYPE_NAMES.QUERY_TYPE)) ||
					((itemType == GRAPHQL_OBJECT_TYPE_NAMES.QUICK_GUIDE_TYPE) && (itemsType == GRAPHQL_OBJECT_TYPE_NAMES.VOD_ITEM_TYPE)) ||
					((itemType == GRAPHQL_OBJECT_TYPE_NAMES.BANNER_TYPE) && (itemsType == GRAPHQL_OBJECT_TYPE_NAMES.ITEM_TYPE));
				const itemCount = actionData.removedItemIds ? actionData.removedItemIds.length : 0;
				const plural = (itemCount > 1);
				const removedItemsTypeName = translateObjectTypeName(actionData.removedItemsType, itemCount, translations, formatMessage, false, false);
				const removedItemIds = actionData?.removedItemIds.join(separator);
				const removedItemNames = actionData?.removedItemNames.join(separator);

				// TODO: UAR: How the next line?
				// const actionString = `User '${context.user.name}' removed the movie '${item.title}' from the quick guide.`;
				if (isUnsetAndNotRemove) {
					if (formatMessage) {
						message = formatMessage(translations.messageUnset, { userName, itemTypeName, itemName, itemId, removedItemsTypeName, removedItemNames, removedItemIds });
					} else {
						message = `User '${userName}' removed ${removedItemsTypeName} '${removedItemNames}' (id='${removedItemIds}') from ${itemTypeName} '${itemName}' (id='${itemId}').`;
					}
					// TODO: UAR: For banner, convert target/target type to something user-friendly (e.g. 'screen', 'catalog', ...) and name (e.g. "Home", "Terminator", ...) of the target should be removed too.
				} else {
					if (formatMessage) {
						message = formatMessage(translations.messageRemove, { userName, itemTypeName, itemName, itemId, itemCount, removedItemsTypeName, removedItemNames, removedItemIds });
					} else {
						message = `User '${userName}' removed ${itemCount} ${removedItemsTypeName} '${removedItemNames}' (${plural ? "ids" : "id"}='${removedItemIds}') from ${itemTypeName} '${itemName}' (id='${itemId}').`;
					}
				}
			} else if (actionType == ACTION_TYPES.REORDER) {
				const reorderedItemsTypeName = translateObjectTypeName(actionData.reorderedItemsType, 2 /* more than 1 to get the plural noun */, translations, formatMessage, false, false);
				const reorderedItemIds = actionData?.reorderedItemIds.join(separator);
				const reorderedItemNames = actionData?.reorderedItemNames.join(separator);

				if (actionData.itemType == undefined) {
					if (formatMessage) {
						message = formatMessage(translations.messageReorder, { userName, itemId, reorderedItemsTypeName, reorderedItemNames, reorderedItemIds });
					} else {
						message = `User '${userName}' reordered the ${reorderedItemsTypeName} to '${reorderedItemNames}' (ids='${reorderedItemIds}').`;
					}
				} else {
					if (formatMessage) {
						message = formatMessage(translations.messageReorderIn, { userName, itemTypeName, itemName, itemId, reorderedItemsTypeName, reorderedItemNames, reorderedItemIds });
					} else {
						message = `User '${userName}' reordered the ${reorderedItemsTypeName} of ${itemTypeName} '${itemName}' (id='${itemId}') to '${reorderedItemNames}' (ids='${reorderedItemIds}').`;
					}
				}
			} else if (actionType == ACTION_TYPES.TARGET) {
				const itemValues = JSON.stringify(actionData.itemValues);

				message = `User '${userName}' updated the targeting of ${itemTypeName} '${itemName}' (id='${itemId}') to '${itemValues}'.`;
			}
			return message;
		} catch (error) {
			const stack = error.stack ? `\nStack: ${error.stack}` : "";
			const message = `Error occurred while composing user activity message: '${error.message}'.${stack}`;
			winston && winston.error(message);

			return "";
		}
	}

	function translateObjectTypeName(itemType, itemCount, translations, formatMessage, capitalized = false, uppercased = false, winston = undefined) {
		try {
			if (formatMessage) {
				if (uppercased) {
					const objectTypeName = formatMessage(translations[`objectType${itemType.replace(/Type$/, "")}Uppercased`], { itemCount });
					if (objectTypeName.trim() != USE_AUTOMATED_BEHAVIOUR) {
						return objectTypeName;
					} else {
						// If no language specific uppercased translation is provided, use the normal name and convert all characters to uppercase programmatically.
						const objectTypeName = formatMessage(translations[`objectType${itemType.replace(/Type$/, "")}`], { itemCount });
						return objectTypeName.toUpperCase();
					}
				} else if (capitalized) {
					const objectTypeName = formatMessage(translations[`objectType${itemType.replace(/Type$/, "")}Capitalized`], { itemCount });
					if (objectTypeName.trim() != USE_AUTOMATED_BEHAVIOUR) {
						return objectTypeName;
					} else {
						// If no language specific capitalised translation is provided, use the normal name and convert the first character to uppercase programmatically.
						// To know why it is not just the first character, see: https://stackoverflow.com/a/53930826
						const objectTypeName = formatMessage(translations[`objectType${itemType.replace(/Type$/, "")}`], { itemCount });
						return capitalizeFirstLetter(objectTypeName);
					}
				} else {
					return formatMessage(translations[`objectType${itemType.replace(/Type$/, "")}`], { itemCount });
				}
			}

			// This code is for serverside when no translations are available.
			// TODO: UAR: Check if we can't also use FormatJS to get the English (not translated) language value instead of hardcoding it here and get missing values or misalignments.
			const plural = (itemCount > 1);
			switch (itemType) {
				case GRAPHQL_OBJECT_TYPE_NAMES.PARENT_SCREEN_TYPE:
					return plural ? "screens" : "screen";
				case GRAPHQL_OBJECT_TYPE_NAMES.SCREEN_TYPE:
					return plural ? "alternative screen configurations" : "alternative screen configuration";
				case GRAPHQL_OBJECT_TYPE_NAMES.HEADER_TYPE:
					return plural ? "headers" : "header";
				case GRAPHQL_OBJECT_TYPE_NAMES.ROW_TYPE:
					return plural ? "rows" : "row";
				case GRAPHQL_OBJECT_TYPE_NAMES.PARENT_CATALOG_TYPE:
					return plural ? "catalogs" : "catalog";
				case GRAPHQL_OBJECT_TYPE_NAMES.CATALOG_TYPE:
					return plural ? "alternative catalog configurations" : "alternative catalog configuration";
				case GRAPHQL_OBJECT_TYPE_NAMES.EPG_ITEM_TYPE:
					return plural ? "EPG items" : "EPG item";
				case GRAPHQL_OBJECT_TYPE_NAMES.VOD_ITEM_TYPE:
					return plural ? "VOD items" : "VOD item";
				case GRAPHQL_OBJECT_TYPE_NAMES.ITEM_TYPE:
					return plural ? "items" : "item";
				case GRAPHQL_OBJECT_TYPE_NAMES.QUERY_TYPE:
					return plural ? "queries" : "query";
				case GRAPHQL_OBJECT_TYPE_NAMES.BANNER_TYPE:
					return plural ? "banners" : "banner";
				case GRAPHQL_OBJECT_TYPE_NAMES.CHANNEL_TYPE:
					return plural ? "channels" : "channel";
				case GRAPHQL_OBJECT_TYPE_NAMES.CHANNEL_LIST_TYPE:
					return plural ? "channel lists" : "channel list";
				case GRAPHQL_OBJECT_TYPE_NAMES.UPSELL_PRODUCT_TYPE:
					return plural ? "upsell products" : "upsell product";
				case GRAPHQL_OBJECT_TYPE_NAMES.SUBSCRIPTION_PRODUCT_TYPE:
					return plural ? "subscription products" : "subscription product";
				case GRAPHQL_OBJECT_TYPE_NAMES.QUICK_GUIDE_TYPE:
					return /* plural ? "quick guide" : */ "quick guide";
				case GRAPHQL_OBJECT_TYPE_NAMES.PUBLISH_INFO_TYPE:
					return /* plural ? "publish info" : */"publish info";
				case GRAPHQL_OBJECT_TYPE_NAMES.HOUSEHOLD_TYPE:
					return plural ? "households" : "household";
				case GRAPHQL_OBJECT_TYPE_NAMES.DEVICE_TYPE:
					return plural ? "devices" : "device";
				case GRAPHQL_OBJECT_TYPE_NAMES.BADGE_TYPE:
					return plural ? "badges" : "badge";
				case GRAPHQL_OBJECT_TYPE_NAMES.MESSAGE_TYPE:
					return plural ? "messages" : "message";
				case GRAPHQL_OBJECT_TYPE_NAMES.MESSAGE_ICON_TYPE:
					return plural ? "message icons" : "message icon";
				case GRAPHQL_OBJECT_TYPE_NAMES.REPLAY_LIST_TYPE:
					return /* plural ? "replay list" : */ "replay list";
				case GRAPHQL_OBJECT_TYPE_NAMES.PAUSE_CONTENT_TYPE:
					return /* plural ? "pause content" : */ "pause content";
				case GRAPHQL_OBJECT_TYPE_NAMES.BADGE_RULES_TYPE:
					return /* plural ? "badge rules" : */ "badge rules";
				default: {
					const message = `Unhandled item type '${itemType}' when translating to the name.`;
					winston && winston.warning(message);

					return itemType;
				}
			}
		} catch (error) {
			const stack = error.stack ? `\nStack: ${error.stack}` : "";
			const message = `Error occurred while translating object type name: '${error.message}'.${stack}`;
			winston && winston.error(message);

			return itemType;
		}
	}

	function translateObjectSubtypeName(actionData, translations, formatMessage) {
		switch (actionData.itemType) {
			case GRAPHQL_OBJECT_TYPE_NAMES.PARENT_SCREEN_TYPE:
				switch (actionData.itemSubtype) {
					case SCREEN_TYPES.ON_DEMAND:
						return actionData.itemSubtype;
					default:
						return "";
				}
			case GRAPHQL_OBJECT_TYPE_NAMES.PARENT_CATALOG_TYPE:
				switch (actionData.itemSubtype) {
					case GRAPHQL_OBJECT_TYPE_NAMES.SCREEN_TYPE:
						if (formatMessage) {
							return formatMessage(translations.catalogTypeEditorial);
						}
						return "editorial";
					case GRAPHQL_OBJECT_TYPE_NAMES.CATALOG_TYPE:
						if (formatMessage) {
							return formatMessage(translations.catalogTypeAutomated);
						}
						return "automated";
					default:
						return "";
				}
			default:
				return "";
		}
	}

	function capitalizeFirstLetter(name) {
		const firstCodeUnit = name[0];
		if ((firstCodeUnit < "\uD800") || (firstCodeUnit > "\uDFFF")) {
			return name[0].toUpperCase() + name.slice(1).toLowerCase().trim();
		}

		return name.slice(0, 2).toUpperCase() + name.slice(2).toLowerCase().trim();
	}

	function safeTrim(object) {
		if (typeof object === "undefined") {
			return "";
		} else if (typeof object === "string") {
			return object.trim();
		} else {
			return object;
		}
	}

	function getLanguageValueFromMultilingualObject(multilingualObject, contentLanguages) {
		// TODO: Add extra parameter preferredContentLanguage which allows the MC user to defined which contentLanguage he wants to see.
		if (multilingualObject && contentLanguages) {
			const first = multilingualObject[contentLanguages[0]] ? safeTrim(multilingualObject[contentLanguages[0]]) : multilingualObject[contentLanguages[1]] ? safeTrim(multilingualObject[contentLanguages[1]]) : null;
			return first;
		} else {
			return null;
		}
	}

	/**
	 * Checks whether the channel reference is from a universal channel.
	 *
	 * @param {string} channelRef The channel reference, e.g.: "S:123", "U:456".
	 * @returns {boolean} Whether the channel reference is from a universal channel.
	 */
	function isUniversalChannel(channelRef) {
		return channelRef.startsWith("U:");
	}

	/**
	 * Retrieves the id of the channel from a channel reference.
	 *
	 * @param {string} channelRef The channel reference, e.g.: "S:123", "U:456".
	 * @returns {string} The id of the channel from a channel reference.
	 */
	function getChannelIdFromChannelRef(channelRef) {
		return channelRef.split(":")[1];
	}

	/**
	 * Retrieves the channel reference of the (plain/non-universal) channel from its channel id.
	 *
	 * @param {string} channelId The channel id, e.g. "123".
	 * @returns {string} The channel reference of the channel from its channel id.
	 */
	function getPlainChannelRefForChannelId(channelId) {
		return `S:${channelId}`;
	}

	/**
	 * Retrieves the channel reference of the universal channel from its channel id.
	 *
	 * @param {string} channelId The channel id, e.g. "123".
	 * @returns {string} The channel reference of the channel from its channel id.
	 */
	function getUniversalChannelRefForChannelId(channelId) {
		return `U:${channelId}`;
	}

	/**
	 * Checks whether the channel reference is valid.
	 *
	 * @param {string} channelRef The channel reference, e.g.: "S:123", "U:456".
	 * @returns {boolean} Whether the channel reference is valid.
	 */
	function isChannelRef(channelRef) {
		return channelRef && (channelRef.startsWith("U:") || channelRef.startsWith("S:"));
	}

	// dateString should not be output from Date -> toString(), toISOString() or toUTCString() for the output of these methods you can use new Date(string)
	// Use when dateString is output of a format function like date-fns format()
	const getDateFromUTCString = (dateString) => {
		const date = new Date(dateString);
		return new Date(
			Date.UTC(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				date.getHours(),
				date.getMinutes(),
				date.getSeconds(),
				date.getMilliseconds()
			)
		);
	};

	const getFormattedUTCDateString = (date, formatting = "yyyy-MM-dd HH:mm:ss.000000") => {
		const offsetDate = new Date(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
			date.getUTCSeconds()
		);
		return format(offsetDate, formatting);
	};

	/**
	 * Checks if the message is scheduled.
	 *
	 * @param {string} startDate The start date of the message.
	 * @returns {boolean} Whether the message is scheduled.
	 */
	function isMessageScheduled(startDate) {
		if (!startDate) {
			return false;
		}
		const configuredStart = new Date(getFormattedUTCDateString(getDateFromUTCString(startDate)));
		return !isSameYear(configuredStart, new Date(DEFAULT_MESSAGE_VALID_START));
	}

	/**
	 * Checks if an alternative configuration of a screen or catalog is scheduled.
	 *
	 * @param {string} startDate The start date of the alternative configuration as ISO8601 string.
	 * @param {string} endDate The end date of the alternative configuration as ISO8601 string.
	 * @returns {boolean} Whether the alternative configuration is scheduled.
	 */
	function isAlternativeScheduled(startDate, endDate) {
		// The "non scheduled value" means the date is empty or it is that of the default constant.
		const startDateIsTheNonScheduledValue = !startDate || (getFormattedUTCDateString(getDateFromUTCString(startDate)) == DEFAULT_ALTERNATIVE_VALID_START);
		const endDateIsTheNonScheduledValue = !endDate || (getFormattedUTCDateString(getDateFromUTCString(startDate)) == DEFAULT_ALTERNATIVE_VALID_END);

		return !(startDateIsTheNonScheduledValue && endDateIsTheNonScheduledValue);
	}

	/**
	 * Retrieves the difference between list1 and list2 (exists in list1 and not in list2).
	 * https://en.wikipedia.org/wiki/Intersection_(set_theory)
	 *
	 * @param {*[]} list1 First list to compare.
	 * @param {*[]} list2 Second list to compare.
	 * @returns {*[]} The difference between list1 and list2 (exists in list1 and not in list2).
	 */
	function getDifference(list1, list2) {
		return list1.filter(value => !list2.includes(value));
	}

	/**
	 * Retrieves the intersection between list1 and list2.
	 * https://en.wikipedia.org/wiki/Intersection_(set_theory)
	 *
	 * @param {*[]} list1 First list to compare.
	 * @param {*[]} list2 Second list to compare.
	 * @returns {*[]} The intersection between list1 and list2.
	 */
	function getIntersection(list1, list2) {
		// winston.debug("Intersection between:");
		// winston.debug(` - ${JSON.stringify(list1)}`);
		// winston.debug(` - ${JSON.stringify(list2)}`);

		return list1.filter(value => list2.includes(value));
	}

	/**
	 * Checks whether list2 is a subset of list1.
	 * https://en.wikipedia.org/wiki/Subset
	 *
	 * @param {*[]} list1 First list to compare.
	 * @param {*[]} list2 Second list to compare.
	 * @returns {boolean} Whether list2 is a subset of list1 or not.
	 */
	function isSubset(list1, list2) {
		return list2.every(value => list1.includes(value));
	}

	/**
	 * Checks list2 contains the exact same items as list1.
	 * https://en.wikipedia.org/wiki/Subset
	 * Checks for really the same item instances, not identical items.
	 * Does not care about order of the items.
	 *
	 * @param {*[]} list1 First list to compare.
	 * @param {*[]} list2 Second list to compare.
	 * @returns {boolean} Whether list2 contains the exact same items as list1.
	 */
	function areEqual(list1, list2) {
		if (list1.length !== list2.length) {
			return false;
		}

		// They number of items are the same and one is a subset of the other, thus they are equal.
		return isSubset(list1, list2);
	}

	// Export the function to "exports".
	// In node.js this will be "exports" of the "module.exports".
	// In browser this will be a function in the global object "SharedUtilities".
	exports.getDateFromUTCString = getDateFromUTCString;
	exports.getFormattedUTCDateString = getFormattedUTCDateString;
	exports.composeUserActivityMessage = composeUserActivityMessage;
	exports.translateObjectTypeName = translateObjectTypeName;
	exports.translateObjectSubtypeName = translateObjectSubtypeName;
	exports.safeTrim = safeTrim;
	exports.getLanguageValueFromMultilingualObject = getLanguageValueFromMultilingualObject;
	exports.isUniversalChannel = isUniversalChannel;
	exports.getChannelIdFromChannelRef = getChannelIdFromChannelRef;
	exports.getPlainChannelRefForChannelId = getPlainChannelRefForChannelId;
	exports.getUniversalChannelRefForChannelId = getUniversalChannelRefForChannelId;
	exports.isChannelRef = isChannelRef;
	exports.capitalizeFirstLetter = capitalizeFirstLetter;
	exports.isMessageScheduled = isMessageScheduled;
	exports.isAlternativeScheduled = isAlternativeScheduled;
	exports.getDifference = getDifference;
	exports.getIntersection = getIntersection;
	exports.isSubset = isSubset;
	exports.areEqual = areEqual;
	exports.CHANNEL_NUMBER_BY_OPTIONS = CHANNEL_NUMBER_BY_OPTIONS;
	exports.DEFAULT_ALTERNATIVE_VALID_START = DEFAULT_ALTERNATIVE_VALID_START;
	exports.DEFAULT_ALTERNATIVE_VALID_END = DEFAULT_ALTERNATIVE_VALID_END;
	exports.DEFAULT_MESSAGE_VALID_START = DEFAULT_MESSAGE_VALID_START;
	exports.DEFAULT_MESSAGE_VALID_END = DEFAULT_MESSAGE_VALID_END;
	exports.VOD_ITEM_TYPES_CONSTANTS = VOD_ITEM_TYPES_CONSTANTS;
	exports.DEEP_LINKS = DEEP_LINKS;
	exports.GRAPHQL_OBJECT_TYPE_NAMES = GRAPHQL_OBJECT_TYPE_NAMES;
	exports.ACTION_TYPES = ACTION_TYPES;
	exports.SCREEN_TYPES = SCREEN_TYPES;
	exports.PARENT_SCREEN_TYPES_BASE_FORM = PARENT_SCREEN_TYPES_BASE_FORM;
	exports.PARENT_SCREEN_TYPES_WITH_UPSELL_PRODUCT_FORM = PARENT_SCREEN_TYPES_WITH_UPSELL_PRODUCT_FORM;
	exports.PAUSE_TARGET_NONE = PAUSE_TARGET_NONE;
	exports.PAUSE_TARGET_DEFAULT = PAUSE_TARGET_DEFAULT;
	exports.PAUSE_TARGET_INVALID_VALUE = PAUSE_TARGET_INVALID_VALUE;
	exports.REALM_NAME = REALM_NAME;
	exports.UPSELL_TYPES_CONSTANTS = UPSELL_TYPES_CONSTANTS;
	exports.DISPLAY_TYPES_CONSTANTS = DISPLAY_TYPES_CONSTANTS;
	exports.CHANNEL_RANGES = CHANNEL_RANGES;
	exports.AUTOMATED_CATALOG_TYPES = AUTOMATED_CATALOG_TYPES;
	exports.PROMISE_STATUS = PROMISE_STATUS;
	exports.DEFAULT_PAGING_VALUES = DEFAULT_PAGING_VALUES;
	exports.NOTIFICATION_TARGET_TYPES = NOTIFICATION_TARGET_TYPES;
	exports.CHANNEL_FORMATS = CHANNEL_FORMATS;
})(typeof exports === "undefined"
	? this.SharedUtilities = {}
	: exports);

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils"
import { Icon } from "@iconify/react";

const MENU_ITEMS = {
  status: [
    { value: "focus", icon: "solar:emoji-funny-circle-line-duotone", label: "Focus" },
    { value: "offline", icon: "solar:moon-sleep-line-duotone", label: "Appear Offline" }
  ],
  profile: [
    { icon: "solar:user-circle-line-duotone", label: "Dashboard", action: "my-account" },
    { icon: "solar:suitcase-tag-line-duotone", label: "My All Trips", action: "my-trips" },
    { icon: "solar:user-circle-line-duotone", label: "Account Menu", action: "my-account-settings" },
  ],
  premium: [
    { 
      icon: "solar:star-bold", 
      label: "Admin Dashboard", 
      action: "admin",
      iconClass: "text-[#01AFD1]",
      badge: { text: "Admin", className: "bg-[#01AFD1] text-white text-[11px]" },
      showIfAdmin: true
    }
  ],
  support: [
    { 
      icon: "solar:headphones-round-sound-line-duotone", 
      label: "Help & Support", 
      action: "support",
    }
  ],
  account: [
    { 
      icon: "solar:logout-3-line-duotone", 
      label: "Log out", 
      action: "logout", 
      iconClass: "text-red-500", 
      labelClass: "text-red-500 font-medium",
      className: "hover:bg-red-50 focus:bg-red-50"
    }
  ]
};

export const UserDropdown = ({ 
  user = {
    name: "Ayman Echakar",
    username: "@aymanch-03",
    avatar: "https://avatars.githubusercontent.com/u/126724835?v=4",
    initials: "AE",
    status: "online",
    role: "user"
  },
  onAction = () => {},
  onStatusChange = () => {},
  selectedStatus = "online",
  promoDiscount = "",
  accounts = []
}) => {
  const renderMenuItem = (item, index) => {
    if (item.showIfAdmin && user.role !== 'admin') return null;

    return (
      <DropdownMenuItem 
        key={index}
        className={cn(item.badge || item.showAvatar || item.rightIcon ? "justify-between" : "", "p-2 rounded-lg cursor-pointer", item.className)}
        onClick={() => onAction(item.action)}
      >
        <span className={cn("flex items-center gap-1.5 font-medium", item.labelClass)}>
          <Icon
            icon={item.icon}
            className={`size-5 ${item.iconClass || "text-gray-500"}`}
          />
          {item.label}
        </span>
        {item.badge && (
          <Badge className={item.badge.className}>
            {promoDiscount || item.badge.text}
          </Badge>
        )}
        {item.rightIcon && (
          <Icon
            icon={item.rightIcon}
            className="size-4 text-gray-500"
          />
        )}
        {item.showAvatar && (
          <Avatar className="cursor-pointer size-6 shadow border border-white">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuItem>
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      online: "text-green-600 bg-green-100 border-green-300",
      offline: "text-gray-600 bg-gray-100 border-gray-300",
      busy: "text-red-600 bg-red-100 border-red-300"
    };
    return colors[status.toLowerCase()] || colors.online;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer size-10 border border-white shadow-sm transition-transform hover:scale-105">
          <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
          <AvatarFallback className="bg-[#01AFD1]/10 text-[#01AFD1] font-bold">{user.initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="z-[200] no-scrollbar w-[280px] rounded-2xl bg-white p-0 shadow-xl border border-gray-100" align="end" sideOffset={8}>
        <section className="bg-white backdrop-blur-lg rounded-2xl p-1 shadow border border-gray-200">
          <div className="flex items-center p-3 border-b border-gray-100 mb-1">
            <div className="flex-1 flex items-center gap-3">
              <Avatar className="cursor-pointer size-12 border border-white shadow-sm">
                <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                <AvatarFallback className="bg-[#01AFD1]/10 text-[#01AFD1] font-bold">{user.initials}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{user.name}</h3>
                <p className="text-gray-500 text-xs truncate">{user.username}</p>
              </div>
            </div>
          </div>

          <DropdownMenuGroup>
            {MENU_ITEMS.profile.map(renderMenuItem)}
          </DropdownMenuGroup>

          {user.role === 'admin' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {MENU_ITEMS.premium.map(renderMenuItem)}
              </DropdownMenuGroup>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {MENU_ITEMS.support.map(renderMenuItem)}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {MENU_ITEMS.account.map(renderMenuItem)}
          </DropdownMenuGroup>
        </section>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;

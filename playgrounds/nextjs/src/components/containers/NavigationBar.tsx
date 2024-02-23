"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { type Chain, CosmosChains, EVMChains, UTXOChains, WalletOption } from "@swapkit/core";
import { Power, PowerOff } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { useSwapKit } from "~/lib/swapKit";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

const items = [
  { name: "Swap", href: "/" },
  { name: "Send", href: "/send" },
  // { name: "TNS", href: "/tns" },
];

interface NavigationBarProps extends React.HTMLAttributes<HTMLDivElement> {}

const AllChains = [...UTXOChains, ...EVMChains, ...CosmosChains];
const allowedChainsByWallet = {
  [WalletOption.XDEFI]: AllChains,
  [WalletOption.METAMASK]: EVMChains,
  [WalletOption.KEPLR]: CosmosChains,
} as const;

export function NavigationBar({ className, ...props }: NavigationBarProps) {
  const [selectedChains, setSelectedChains] = useState<Chain[]>([]);
  const { walletType, isWalletConnected, connectWallet } = useSwapKit();
  const pathname = usePathname();

  const handleChainSelect = (chain: Chain) => (checked: boolean) => {
    if (checked) {
      setSelectedChains((prev) => [...prev, chain]);
    } else {
      setSelectedChains((prev) => prev.filter((c) => c !== chain));
    }
  };

  const checkWalletDisabled = useCallback(
    (option: WalletOption) => {
      // @ts-expect-error
      const allowedChains = allowedChainsByWallet[option] as Chain[];

      if (!(allowedChains?.length && selectedChains?.length)) return false;

      return !selectedChains.every((chain) => allowedChains.includes(chain));
    },
    [selectedChains],
  );

  const handleWalletSelect = useCallback(
    (option: WalletOption) => {
      // @ts-expect-error
      const allowedChains = allowedChainsByWallet[option] as Chain[];

      if (!allowedChains.length || checkWalletDisabled(option)) return;

      if (selectedChains.length === 0) {
        setSelectedChains(allowedChains);
      } else {
        connectWallet(option, selectedChains);
      }
    },
    [checkWalletDisabled, connectWallet, selectedChains],
  );

  return (
    // @ts-expect-error
    <ScrollArea className="max-w-[600px] lg:max-w-none pt-4 mb-4 border-b">
      <div className="flex justify-between flex-row">
        <div className={cn("mb-4 flex items-center", className)} {...props}>
          {items.map(({ href, name }) => (
            <Link
              href={href}
              key={href}
              className={cn(
                "flex h-10 items-center justify-center rounded-full px-4 text-center transition-colors hover:text-primary",
                pathname === href ? "bg-muted font-medium text-primary" : "text-muted-foreground",
              )}
            >
              {name}
            </Link>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button asChild variant="ghost" className="space-x-2">
              <div>
                {isWalletConnected ? (
                  <PowerOff size={18} className="text-red-400" />
                ) : (
                  <Power size={18} className="text-slate-400" />
                )}

                <span>{isWalletConnected ? `Disconnect (${walletType})` : "Connect Wallet"}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="max-w-[400px] z-auto">
            <div className="flex flex-row flex-wrap bg-slate-900 p-4 gap-3">
              {[...UTXOChains, ...EVMChains, ...CosmosChains].map((chain) => (
                <div key={chain} className="flex w-[70px] justify-between items-center">
                  <span
                    className={
                      selectedChains.includes(chain) ? "text-primary" : "text-muted-foreground"
                    }
                  >
                    {chain}
                  </span>
                  <Checkbox
                    checked={selectedChains.includes(chain)}
                    onCheckedChange={handleChainSelect(chain)}
                    key={chain}
                  />
                </div>
              ))}
            </div>

            <div className="bg-slate-800 p-4">
              {[WalletOption.XDEFI, WalletOption.METAMASK, WalletOption.KEPLR].map((option) => (
                <Button
                  variant="ghost"
                  key={option}
                  className={checkWalletDisabled(option) ? "text-muted-foreground" : "text-primary"}
                  disabled={checkWalletDisabled(option)}
                  onClick={() => handleWalletSelect(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}

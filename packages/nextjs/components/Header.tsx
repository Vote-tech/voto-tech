"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RainbowKitCustomConnectButton } from "./scaffold-eth";
import { useAccount } from "wagmi";
import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  useOutsideClick,
  useScaffoldContractRead,
} from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
];

const adminPageLink: HeaderMenuLink = {
  label: "Admin",
  href: "/admin",
};

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  const { address } = useAccount();

  const { data: owner } = useScaffoldContractRead({
    contractName: "MACIWrapper",
    functionName: "owner",
  });

  return (
    <>
      {[...menuLinks, ...(address === owner ? [adminPageLink] : [])].map(
        ({ label, href, icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                passHref
                className={`${
                  isActive ? "bg-secondary shadow-md" : ""
                } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            </li>
          );
        },
      )}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="sticky lg:static top-0 navbar min-h-0 flex-shrink-0 bg-base-100 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2 ">
      <div className="navbar-start w-auto lg:w-1/2">
        <div className="lg:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${
              isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"
            }`}
            onClick={() => {
              setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div>
        <Link
          href="/"
          passHref
          className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0"
        >
          <div className="flex relative w-10 h-10">
            <Image
              alt="Voto logo"
              className="cursor-pointer rounded-md"
              fill
              src="/logo.svg"
            />
          </div>
          <div className="flex flex-col h-10 justify-between">
            <span className="font-bold leading-tight">Voto.tech</span>
            <span className="text-xs">
              Decentralized anonymous voting solution
            </span>
          </div>
        </Link>
      </div>
      <div className="navbar-center">
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2 justify-items-center">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end">
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2 justify-items-center">
          <RainbowKitCustomConnectButton />
        </ul>
      </div>
    </div>
  );
};

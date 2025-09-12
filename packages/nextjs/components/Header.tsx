'use client';

import React from 'react';
import Image from 'next/image';
// import Image from "next/image";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaucetButton, RainbowKitCustomConnectButton } from '~~/components/scaffold-eth';
import { StorachaModal } from '~~/components/storage/StorachaModal';
import { StorageButton } from '~~/components/storage/StorageButton';
import { StorageServicesModal } from '~~/components/storage/StorageServicesModal';

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: 'Home',
    href: '/',
  },
  // {
  //   label: "Debug Contracts",
  //   href: "/debug",
  //   icon: <BugAntIcon className="h-4 w-4" />,
  // },
  {
    label: 'Checkin form (dev)',
    href: '/checkin',
  },
  {
    label: 'attestation(dev)',
    href: '/attestation',
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? 'bg-secondary shadow-md' : ''
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  return (
    <>
      <div className="z-[100] bg-white sticky lg:static top-0 navbar  min-h-0 flex-shrink-0 justify-between shadow-subtle">
        <div className="navbar-start w-auto lg:w-1/2">
          <div className="text-center block font-bold ">
            <Link href={'/'} className="flex items-center space-x-2 ml-2">
              <Image alt="astral_sparkels" height={30} width={30} src={'/astral-sparkles.svg'} />
              <span className="text-black font-bold">Logbook</span>
            </Link>
          </div>
        </div>

        <div className="navbar-end flex-grow mr-4">
          <a href="https://docs.astral.global/docs/logbook/introduction" target="_blank" className="inline-block">
            <button className="btn btn-ghost btn-sm border-0 text-black mr-2">Docs</button>
          </a>
          <StorageButton />
          <RainbowKitCustomConnectButton />
          <FaucetButton />
        </div>
      </div>

      {/* Storage Modals */}
      <StorageServicesModal />
      <StorachaModal />
    </>
  );
};
